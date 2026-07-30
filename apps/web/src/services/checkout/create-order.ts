import { randomBytes, randomUUID } from "node:crypto";
import { RESERVATION_EXPIRY_MS } from "@/config/inventory";
import type { PricedCartLine } from "@/core/cart/rules";
import type { DeliveryAddress, FulfillmentMethod, FulfillmentSchedule } from "@/core/delivery/entities";
import { ConflictError, ValidationError } from "@/core/errors";
import { ACTIVE_CURRENCY } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import { buildOrderLinesFromPricedCart, buildOrderNumber, ORDER_NUMBER_RANDOM_LENGTH } from "@/core/orders/rules";
import { PAYMENT_METHODS, type PaymentMethod } from "@/core/payments/entities";
import { clearCart } from "@/services/cart/clear-cart";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { reserveOrderLines, type ReservationLineInput } from "@/services/inventory/reservations";
import { createPayment } from "@/services/payments/create-payment";
import { defaultCheckoutDeps, type CheckoutDeps } from "./dependencies";
import { validateCustomer, validateFulfillment, type CheckoutCustomerInput } from "./validation";

const MAX_ORDER_NUMBER_ATTEMPTS = 5;
const IDEMPOTENCY_SCOPE = "checkout";

export interface CheckoutInput {
  cartId: string;
  /** A fresh, client-generated key per checkout attempt — see README's Idempotency section for why retrying a *failed* submission needs a new key rather than reusing this one. */
  idempotencyKey: string;
  customer: CheckoutCustomerInput;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: DeliveryAddress;
  pickupInstructions?: string;
  schedule: FulfillmentSchedule;
  paymentMethod: PaymentMethod;
  /** Required for `paymentMethod: "tap"` — where Tap's hosted page redirects the shopper's browser back to. */
  returnUrl?: string;
}

export interface CheckoutResult {
  order: Order;
  /** Present only when `paymentMethod` is `"tap"` — the browser must be redirected here to complete payment. */
  paymentRedirectUrl?: string;
}

function reservationLinesFromPriced(lines: readonly PricedCartLine[]): ReservationLineInput[] {
  return lines
    .filter((line): line is PricedCartLine & { snapshot: NonNullable<PricedCartLine["snapshot"]> } => line.effectiveQuantity > 0 && line.snapshot !== undefined)
    .map((line) => ({
      productId: line.line.productId,
      variantId: line.line.variantId,
      quantity: line.effectiveQuantity,
      allowBackorder: line.snapshot.allowBackorder,
      trackInventory: line.snapshot.trackInventory,
    }));
}

/**
 * The single checkout/order-creation use case — validates every input
 * server-side (customer info, fulfillment/schedule, payment method), never
 * trusts anything the browser sent for price/name/availability (revalidates
 * the cart against live catalog data via `getPricedCart` immediately before
 * building the order), then creates the order, reserves inventory, opens a
 * payment session (`tap` only), clears the cart, and sends the order
 * confirmation email — in that order, with the whole submission guarded by
 * an idempotency key so a duplicate/retried request never creates a second
 * order. See README's Checkout flow section for the full sequence and its
 * failure-handling/rollback behavior.
 */
export async function createOrder(input: CheckoutInput, deps: CheckoutDeps = defaultCheckoutDeps): Promise<CheckoutResult> {
  if (!(PAYMENT_METHODS as readonly string[]).includes(input.paymentMethod)) {
    throw new ValidationError("Unsupported payment method.");
  }
  if (input.paymentMethod === "tap" && !input.returnUrl) {
    throw new ValidationError("A return URL is required for card payments.");
  }

  const now = new Date();
  const customer = validateCustomer(input.customer);
  const fulfillment = validateFulfillment(
    {
      fulfillmentMethod: input.fulfillmentMethod,
      deliveryAddress: input.deliveryAddress,
      pickupInstructions: input.pickupInstructions,
      schedule: input.schedule,
    },
    now,
  );

  const { record, created } = await deps.idempotency.begin(IDEMPOTENCY_SCOPE, input.idempotencyKey);
  if (!created) {
    if (record.status === "completed" && record.resultRef) {
      const existingOrder = await deps.orders.findById(record.resultRef);
      if (existingOrder) {
        // A genuine idempotent retry of an already-completed submission —
        // no new Tap redirect URL is reconstructed here (a `Payment` only
        // ever stores the provider's charge id, not the hosted-page URL),
        // so a retried `tap` checkout gets the order back without one; the
        // caller should query the order/payment status directly instead.
        return { order: existingOrder };
      }
    }
    if (record.status === "in_progress") {
      throw new ConflictError("This checkout submission is already being processed.");
    }
    throw new ConflictError("This checkout submission already failed previously. Please try again with a new request.");
  }

  try {
    const { priced } = await getPricedCart(input.cartId, deps.cart);
    if (priced.lines.length === 0) {
      throw new ValidationError("Your cart is empty.");
    }
    if (priced.hasBlockingIssues) {
      throw new ValidationError("Some items in your cart are no longer available. Please review your cart before checking out.");
    }

    const lines = buildOrderLinesFromPricedCart(priced.lines);
    const orderId = randomUUID();

    let order: Order | undefined;
    let lastConflict: ConflictError | undefined;
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
      const orderNumber = buildOrderNumber(now, randomBytes(ORDER_NUMBER_RANDOM_LENGTH));
      const candidate: Order = {
        id: orderId,
        orderNumber,
        customer,
        fulfillment,
        lines,
        subtotal: priced.subtotal,
        shippingFee: priced.shippingFee,
        discountTotal: priced.discountTotal,
        grandTotal: priced.grandTotal,
        currency: ACTIVE_CURRENCY.code,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "tap" ? "pending" : "cash_pending",
        status: input.paymentMethod === "tap" ? "pending_payment" : "confirmed",
        source: "web",
        idempotencyKey: input.idempotencyKey,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await deps.orders.create(candidate);
        order = candidate;
        break;
      } catch (error) {
        if (!(error instanceof ConflictError)) throw error;
        lastConflict = error;
      }
    }
    if (!order) {
      throw lastConflict ?? new ConflictError("Could not generate a unique order number.");
    }

    const reservationLines = reservationLinesFromPriced(priced.lines);
    const reservationExpiresAt = new Date(now.getTime() + RESERVATION_EXPIRY_MS[input.paymentMethod]);

    try {
      await reserveOrderLines(order.id, reservationLines, reservationExpiresAt, "system:checkout", deps.inventory);
    } catch (error) {
      await deps.orders.update(order.id, { status: "cancelled", cancelledAt: new Date() }, order.version);
      throw error;
    }

    await deps.auditLogs.record({
      type: "cart_checkout_started",
      actorUid: null,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, paymentMethod: order.paymentMethod },
    });
    await deps.auditLogs.record({
      type: "order_created",
      actorUid: null,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });

    let paymentRedirectUrl: string | undefined;
    if (input.paymentMethod === "tap") {
      const { redirectUrl } = await createPayment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          method: "tap",
          amount: order.grandTotal,
          customerEmail: customer.email,
          customerName: customer.fullName,
          // Carries the order number through Tap's hosted-page redirect so
          // `/checkout/success` can pre-fill it in the verified-tracking
          // lookup form — the email/mobile the shopper types there (not
          // this URL) is what actually gates seeing the order.
          returnUrl: `${input.returnUrl}${input.returnUrl?.includes("?") ? "&" : "?"}order=${encodeURIComponent(order.orderNumber)}`,
        },
        deps.payments,
      );
      paymentRedirectUrl = redirectUrl;
    } else {
      await createPayment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          method: "cash",
          amount: order.grandTotal,
          customerEmail: customer.email,
          customerName: customer.fullName,
        },
        deps.payments,
      );
    }

    await clearCart(input.cartId, deps.cart);

    await sendTransactionalEmail(
      {
        to: customer.email,
        template: "order_confirmation",
        data: {
          orderNumber: order.orderNumber,
          customerName: customer.fullName,
          lines: order.lines.map((line) => ({ name: line.productName, quantity: line.quantity, lineTotal: line.lineTotal })),
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          grandTotal: order.grandTotal,
          fulfillmentMethod: fulfillment.method,
        },
      },
      deps.email,
    );

    await deps.idempotency.complete(IDEMPOTENCY_SCOPE, input.idempotencyKey, order.id);

    return { order, paymentRedirectUrl };
  } catch (error) {
    await deps.idempotency.fail(IDEMPOTENCY_SCOPE, input.idempotencyKey);
    throw error;
  }
}

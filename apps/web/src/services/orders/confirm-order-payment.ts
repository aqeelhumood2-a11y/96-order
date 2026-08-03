import type { Session } from "@/core/auth/entities";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { confirmOrderPaymentSchema, type ConfirmOrderPaymentInput } from "@/core/orders/schemas";
import { requirePermission } from "@/services/auth/session";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { commitOrderReservations } from "@/services/inventory/reservations";
import { defaultOrderManagementDeps, type OrderManagementDeps } from "./dependencies";

/**
 * The manual admin override for a `tap` order stuck in `pending_payment`
 * whose Tap webhook never arrived (network issue, provider outage) but a
 * staff member has independently verified the charge succeeded in Tap's
 * own dashboard. Mirrors `services/payments/handle-tap-webhook.ts`'s own
 * `event.status === "paid"` branch exactly (commit reservations, update
 * the `Payment` and `Order`, send the confirmation email) rather than
 * routing through `change-order-status.ts` — like Phase 5's
 * `confirm-cash-payment.ts`, this does more than a plain status
 * transition (it resolves `paymentStatus` first), so it stays its own use
 * case. Gated on `payments:manage`, the same permission
 * `confirm-cash-payment.ts` and the Tap webhook's own audit entries use
 * for a payment-resolving action.
 */
export async function confirmOrderPayment(actor: Session, rawInput: ConfirmOrderPaymentInput, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  requirePermission(actor, "payments:manage");
  const input = confirmOrderPaymentSchema.parse(rawInput);

  const order = await deps.orders.findById(input.orderId);
  if (!order) {
    throw new NotFoundError("Order not found.");
  }
  if (order.paymentMethod !== "tap") {
    throw new ValidationError("This order was not placed with card payment.");
  }
  if (order.version !== input.expectedVersion) {
    throw new ConflictError("This order was changed by someone else. Reload and try again.");
  }
  if (order.paymentStatus === "paid") {
    return order;
  }
  if (order.paymentStatus !== "pending" && order.paymentStatus !== "authorized") {
    throw new ConflictError(`Cannot confirm payment for an order with payment status "${order.paymentStatus}".`);
  }

  await commitOrderReservations(order.id, actor.uid, deps.inventory);

  const payment = await deps.payments.payments.findByOrderId(order.id);
  if (payment) {
    await deps.payments.payments.update(payment.id, { status: "paid" });
  }

  await deps.orders.update(order.id, { status: "confirmed", paymentStatus: "paid" }, order.version);
  await deps.orderEvents.record({ orderId: order.id, fromStatus: order.status, toStatus: "confirmed", actorId: actor.uid, note: "Manually confirmed by admin" });

  await deps.auditLogs.record({
    type: "order_payment_confirmed",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });

  await sendTransactionalEmail(
    { to: order.customer.email, template: "payment_confirmation", data: { orderNumber: order.orderNumber, amount: order.grandTotal } },
    deps.email,
  );

  return { ...order, status: "confirmed", paymentStatus: "paid", version: order.version + 1 };
}

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import type { Payment } from "@/core/payments/entities";
import { ConsoleEmailProvider } from "@/infrastructure/email/console-email-provider";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";
import { FirestoreEmailOutboxRepository } from "@/infrastructure/firebase/repositories/firestore-email-outbox-repository";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestoreInventoryReservationRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-reservation-repository";
import { FirestoreOrderEventRepository } from "@/infrastructure/firebase/repositories/firestore-order-event-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestorePaymentRepository } from "@/infrastructure/firebase/repositories/firestore-payment-repository";
import { FirestorePaymentWebhookEventRepository } from "@/infrastructure/firebase/repositories/firestore-payment-webhook-event-repository";
import { FakeTapProvider } from "@/infrastructure/payments/tap/fake-tap-provider";
import type { PaymentOrchestrationDeps } from "@/services/payments/dependencies";
import { handleTapWebhook } from "@/services/payments/handle-tap-webhook";

const orders = new FirestoreOrderRepository();
const orderEvents = new FirestoreOrderEventRepository();
const inventory = new FirestoreInventoryRepository();
const inventoryReservations = new FirestoreInventoryReservationRepository();
const paymentsRepo = new FirestorePaymentRepository();
const webhookEvents = new FirestorePaymentWebhookEventRepository();
const auditLogs = new FirestoreAuditLogRepository();
const provider = new FakeTapProvider();
const customers = new FirestoreCustomerRepository();

/** Real Firestore adapters throughout (proving the actual reconciliation logic against a real database), only the transport is faked — see `FakeTapProvider`'s own doc comment. */
const deps: PaymentOrchestrationDeps = {
  payments: { payments: paymentsRepo, webhookEvents, provider, auditLogs },
  orders,
  orderEvents,
  inventory: { reservations: inventoryReservations, auditLogs },
  email: { email: new ConsoleEmailProvider(), outbox: new FirestoreEmailOutboxRepository() },
  customers,
};

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: randomUUID(),
    orderNumber: `ORD-260130-${randomUUID().slice(0, 6).toUpperCase()}`,
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: `ahmed-${randomUUID().slice(0, 6)}@example.com` },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [
      { productId: "product-1", variantId: null, productName: "Ethiopia Yirgacheffe", sku: "ETH-1", imageUrl: null, unitPrice: money(1899), quantity: 2, lineTotal: money(3798) },
    ],
    subtotal: money(3798),
    shippingFee: money(2000),
    discountTotal: money(0),
    grandTotal: money(5798),
    currency: "BHD",
    paymentMethod: "tap",
    paymentStatus: "pending",
    status: "pending_payment",
    source: "web",
    idempotencyKey: randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const FUTURE = new Date(Date.now() + 30 * 60 * 1000);

describe("Tap webhook reconciliation against real Firestore (emulator)", () => {
  it("commits the reservation and confirms the order on the first 'paid' delivery, then no-ops on a redelivery", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });

    const order = makeOrder();
    await orders.create(order);
    await inventoryReservations.reserve({ orderId: order.id, productId, variantId: null, quantity: 2, allowBackorder: false, actorId: "system:checkout", expiresAt: FUTURE });

    const charge = await provider.createCharge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      customerEmail: order.customer.email,
      customerName: order.customer.fullName,
      returnUrl: "https://example.com/checkout/success",
    });
    const payment: Payment = {
      id: randomUUID(),
      orderId: order.id,
      method: "tap",
      status: "pending",
      amount: order.grandTotal,
      currency: "BHD",
      providerReference: charge.providerReference,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await paymentsRepo.create(payment);

    const rawBody = provider.buildWebhookBody(charge.providerReference, "paid");
    await handleTapWebhook(rawBody, "any-signature", deps);

    const updatedOrder = await orders.findById(order.id);
    expect(updatedOrder?.status).toBe("confirmed");
    expect(updatedOrder?.paymentStatus).toBe("paid");

    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.onHand).toBe(3);
    expect(record?.reserved).toBe(0);

    const updatedPayment = await paymentsRepo.findById(payment.id);
    expect(updatedPayment?.status).toBe("paid");

    // A redelivery of the exact same event (same charge id + same status)
    // must not run the reconciliation a second time.
    await handleTapWebhook(rawBody, "any-signature", deps);
    const afterRedelivery = await inventory.findByProductAndVariant(productId, null);
    expect(afterRedelivery?.onHand).toBe(3);
  });

  it("releases the reservation and cancels the order on a 'failed' delivery", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });

    const order = makeOrder();
    await orders.create(order);
    await inventoryReservations.reserve({ orderId: order.id, productId, variantId: null, quantity: 2, allowBackorder: false, actorId: "system:checkout", expiresAt: FUTURE });

    const charge = await provider.createCharge({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.grandTotal,
      customerEmail: order.customer.email,
      customerName: order.customer.fullName,
      returnUrl: "https://example.com/checkout/success",
    });
    const payment: Payment = {
      id: randomUUID(),
      orderId: order.id,
      method: "tap",
      status: "pending",
      amount: order.grandTotal,
      currency: "BHD",
      providerReference: charge.providerReference,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await paymentsRepo.create(payment);

    const rawBody = provider.buildWebhookBody(charge.providerReference, "failed");
    await handleTapWebhook(rawBody, "any-signature", deps);

    const updatedOrder = await orders.findById(order.id);
    expect(updatedOrder?.status).toBe("cancelled");
    expect(updatedOrder?.paymentStatus).toBe("failed");

    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.onHand).toBe(5);
    expect(record?.reserved).toBe(0);
  });
});

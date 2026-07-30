import { UnauthorizedError } from "@/core/errors";
import { commitOrderReservations, releaseOrderReservations } from "@/services/inventory/reservations";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { defaultPaymentOrchestrationDeps, type PaymentOrchestrationDeps } from "./dependencies";

const WEBHOOK_ACTOR = "system:tap_webhook";

/**
 * The one entry point for every Tap webhook delivery. Order of operations
 * matters: signature verification first (a failed/missing signature never
 * reaches anything else), then the eventId-keyed duplicate check (a
 * redelivery of an already-processed event is a silent no-op, not an
 * error — Tap expects a 200 either way), and only then any state change.
 *
 * The order/payment transition only actually happens while the order is
 * still `pending_payment` — a webhook that arrives after the order was
 * already resolved (by an earlier webhook, or a reconciliation call) is
 * recorded for audit purposes but doesn't re-trigger inventory commit/
 * release a second time, on top of `commitOrderReservations`/
 * `releaseOrderReservations` already being idempotent themselves.
 */
export async function handleTapWebhook(
  rawBody: string,
  signatureHeader: string | null,
  deps: PaymentOrchestrationDeps = defaultPaymentOrchestrationDeps,
): Promise<void> {
  if (!deps.payments.provider.verifyWebhookSignature(rawBody, signatureHeader)) {
    throw new UnauthorizedError("Invalid webhook signature.");
  }

  const event = deps.payments.provider.parseWebhookEvent(rawBody);

  const alreadyProcessed = await deps.payments.webhookEvents.findById(event.eventId);
  if (alreadyProcessed) {
    return;
  }

  const payment = await deps.payments.payments.findByProviderReference(event.providerReference);

  await deps.payments.webhookEvents.record({
    id: event.eventId,
    provider: "tap",
    paymentId: payment?.id ?? null,
    eventType: event.eventType,
    receivedAt: new Date(),
    processedAt: null,
  });

  await deps.payments.auditLogs.record({
    type: "payment_webhook_received",
    actorUid: null,
    metadata: { eventId: event.eventId, eventType: event.eventType, providerReference: event.providerReference },
  });

  if (!payment) {
    await deps.payments.webhookEvents.markProcessed(event.eventId, new Date());
    return;
  }

  await deps.payments.payments.update(payment.id, { status: event.status });

  const order = await deps.orders.findById(payment.orderId);
  if (order && order.status === "pending_payment") {
    if (event.status === "paid") {
      await commitOrderReservations(order.id, WEBHOOK_ACTOR, deps.inventory);
      await deps.orders.update(order.id, { status: "confirmed", paymentStatus: "paid" }, order.version);
      await deps.payments.auditLogs.record({
        type: "payment_succeeded",
        actorUid: null,
        metadata: { orderId: order.id, orderNumber: order.orderNumber, paymentId: payment.id },
      });
      await sendTransactionalEmail(
        { to: order.customer.email, template: "payment_confirmation", data: { orderNumber: order.orderNumber, amount: order.grandTotal } },
        deps.email,
      );
    } else if (event.status === "failed" || event.status === "cancelled") {
      await releaseOrderReservations(order.id, WEBHOOK_ACTOR, deps.inventory);
      await deps.orders.update(order.id, { status: "cancelled", paymentStatus: event.status, cancelledAt: new Date() }, order.version);
      await deps.payments.auditLogs.record({
        type: "payment_failed",
        actorUid: null,
        metadata: { orderId: order.id, orderNumber: order.orderNumber, paymentId: payment.id, status: event.status },
      });
      await sendTransactionalEmail({ to: order.customer.email, template: "payment_failure", data: { orderNumber: order.orderNumber } }, deps.email);
    }
    // "pending"/"authorized" — the payment status is recorded above, but no order transition happens yet.
  }

  await deps.payments.webhookEvents.markProcessed(event.eventId, new Date());
}

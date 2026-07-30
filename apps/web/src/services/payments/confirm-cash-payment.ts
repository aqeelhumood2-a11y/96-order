import type { Session } from "@/core/auth/entities";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { requirePermission } from "@/services/auth/session";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { commitOrderReservations } from "@/services/inventory/reservations";
import { defaultPaymentOrchestrationDeps, type PaymentOrchestrationDeps } from "./dependencies";

/**
 * The minimal protected admin action the Phase 5 spec calls for: an
 * authorized staff member confirming that cash was actually received for
 * a cash-on-delivery/pickup order. This is the only event that converts a
 * cash order's *reserved* inventory into a permanent deduction — see
 * README's Cash order lifecycle section. A full order-management UI
 * (listing, filtering, bulk actions) belongs to Phase 6; this is just the
 * use case a minimal action button can call.
 */
export async function confirmCashPayment(actor: Session, orderId: string, deps: PaymentOrchestrationDeps = defaultPaymentOrchestrationDeps): Promise<Order> {
  requirePermission(actor, "payments:manage");

  const order = await deps.orders.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order not found.");
  }
  if (order.paymentMethod !== "cash") {
    throw new ValidationError("This order was not placed with cash payment.");
  }

  if (order.paymentStatus === "cash_confirmed") {
    return order;
  }
  if (order.paymentStatus !== "cash_pending") {
    throw new ConflictError(`Cannot confirm cash payment for an order with payment status "${order.paymentStatus}".`);
  }

  await commitOrderReservations(order.id, actor.uid, deps.inventory);

  const payment = await deps.payments.payments.findByOrderId(order.id);
  if (payment) {
    await deps.payments.payments.update(payment.id, { status: "cash_confirmed" });
  }

  await deps.orders.update(order.id, { paymentStatus: "cash_confirmed" }, order.version);

  await deps.payments.auditLogs.record({
    type: "cash_payment_confirmed",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  });

  await sendTransactionalEmail(
    { to: order.customer.email, template: "payment_confirmation", data: { orderNumber: order.orderNumber, amount: order.grandTotal } },
    deps.email,
  );

  return { ...order, paymentStatus: "cash_confirmed", version: order.version + 1 };
}

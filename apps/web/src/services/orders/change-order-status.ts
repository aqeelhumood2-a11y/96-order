import type { Session } from "@/core/auth/entities";
import { reverseCancelledOrderSpend } from "@/core/customer/rules";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { isValidOrderStatusTransition } from "@/core/orders/rules";
import type { ChangeOrderStatusInput } from "@/core/orders/schemas";
import { changeOrderStatusSchema } from "@/core/orders/schemas";
import { PAYMENT_STATUSES_AUTHORIZING_COMMIT } from "@/core/payments/entities";
import { requirePermission } from "@/services/auth/session";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { releaseOrderReservations } from "@/services/inventory/reservations";
import { defaultOrderManagementDeps, type OrderManagementDeps } from "./dependencies";

/**
 * The one order-status-transition use case every admin "Order Action"
 * (cancel, mark preparing/ready/out-for-delivery, complete) funnels
 * through — see `services/orders/order-actions.ts` for the named,
 * single-purpose wrappers the admin UI actually calls. Enforces:
 *
 * 1. `orders:manage` permission.
 * 2. Optimistic concurrency (`expectedVersion` must match the order's
 *    current `version`) — the same guard `OrderRepository.update()` itself
 *    re-checks inside its transaction, so this is defense-in-depth against
 *    acting on stale admin-UI state, not the only place it's enforced.
 * 3. `core/orders/rules.ts#isValidOrderStatusTransition` — an invalid
 *    transition is rejected with a `ValidationError` before anything is
 *    written. A request that's already in the target status is a no-op
 *    (idempotent retry of the same button click), not an error.
 * 4. Fulfillment-method-specific guards (`out_for_delivery` only for a
 *    delivery order) and a payment guard (`completed` requires the
 *    payment to have actually been confirmed — `paid` or
 *    `cash_confirmed` — so an order can never be marked complete while
 *    still unpaid).
 *
 * Side effects, keyed by the target status: `cancelled` releases any
 * still-`reserved` inventory (see `releaseOrderReservations` — a no-op if
 * the reservation was already committed, since committing already
 * permanently deducted `onHand`; cancelling an order *after* its
 * inventory was committed is a data-integrity edge case that needs a
 * manual inventory correction, not an automatic reversal — see README's
 * Known limitations) and reverses this order's contribution to its
 * customer's `totalSpent`; `ready` (pickup) and `out_for_delivery`
 * (delivery) each send the matching Phase 5 email template that existed
 * but was never wired up until now.
 */
export async function changeOrderStatus(actor: Session, rawInput: ChangeOrderStatusInput, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  requirePermission(actor, "orders:manage");
  const input = changeOrderStatusSchema.parse(rawInput);

  const order = await deps.orders.findById(input.orderId);
  if (!order) {
    throw new NotFoundError("Order not found.");
  }
  if (order.version !== input.expectedVersion) {
    throw new ConflictError("This order was changed by someone else. Reload and try again.");
  }

  if (order.status === input.toStatus) {
    return order;
  }
  if (!isValidOrderStatusTransition(order.status, input.toStatus)) {
    throw new ValidationError(`Cannot move an order from "${order.status}" to "${input.toStatus}".`);
  }
  if (input.toStatus === "out_for_delivery" && order.fulfillment.method !== "delivery") {
    throw new ValidationError("Only a delivery order can be marked out for delivery.");
  }
  if (input.toStatus === "completed" && !PAYMENT_STATUSES_AUTHORIZING_COMMIT.includes(order.paymentStatus)) {
    throw new ValidationError("Cannot complete an order before its payment is confirmed.");
  }

  const now = new Date();
  const patch: Partial<Order> = { status: input.toStatus };
  if (input.toStatus === "cancelled") patch.cancelledAt = now;
  if (input.toStatus === "completed") patch.completedAt = now;

  if (input.toStatus === "cancelled") {
    await releaseOrderReservations(order.id, actor.uid, deps.inventory);
    if (order.customerId) {
      await deps.customers.upsert(order.customerId, (existing) => {
        if (!existing) throw new NotFoundError("Customer record not found for this order.");
        return reverseCancelledOrderSpend(existing, order.grandTotal, now);
      });
    }
  }

  await deps.orderEvents.record({ orderId: order.id, fromStatus: order.status, toStatus: input.toStatus, actorId: actor.uid, note: input.note });
  await deps.orders.update(order.id, patch, order.version);

  await deps.auditLogs.record({
    type: "order_status_changed",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { orderId: order.id, orderNumber: order.orderNumber, fromStatus: order.status, toStatus: input.toStatus },
  });

  if (input.toStatus === "ready" && order.fulfillment.method === "pickup") {
    await sendTransactionalEmail(
      {
        to: order.customer.email,
        template: "pickup_confirmation",
        data: {
          orderNumber: order.orderNumber,
          locationName: order.fulfillment.pickup.locationName,
          locationAddress: order.fulfillment.pickup.locationAddress,
          scheduleDate: order.fulfillment.schedule.date,
          scheduleTimeWindow: order.fulfillment.schedule.timeWindow,
        },
      },
      deps.email,
    );
  }
  if (input.toStatus === "out_for_delivery" && order.fulfillment.method === "delivery") {
    await sendTransactionalEmail(
      {
        to: order.customer.email,
        template: "delivery_confirmation",
        data: { orderNumber: order.orderNumber, scheduleDate: order.fulfillment.schedule.date, scheduleTimeWindow: order.fulfillment.schedule.timeWindow },
      },
      deps.email,
    );
  }

  return { ...order, ...patch, version: order.version + 1, updatedAt: now };
}

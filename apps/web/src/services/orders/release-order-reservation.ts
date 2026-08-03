import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { releaseOrderReservations } from "@/services/inventory/reservations";
import { defaultOrderManagementDeps, type OrderManagementDeps } from "./dependencies";

/**
 * The manual "Release reservation" admin action — README's Order Actions
 * list. Distinct from cancelling the order itself: a staff member might
 * need to free up reserved stock (e.g. a customer asked to remove an item
 * one won't be fulfilled) without necessarily moving the whole order to
 * `cancelled`. Idempotent — `releaseOrderReservations` is itself a no-op
 * for any line that's already `released`/`committed`.
 */
export async function releaseOrderReservation(actor: Session, orderId: string, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<void> {
  requirePermission(actor, "orders:manage");

  const order = await deps.orders.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  await releaseOrderReservations(orderId, actor.uid, deps.inventory);
}

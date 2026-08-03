import type { Session } from "@/core/auth/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "./dependencies";

const SWEEP_ACTOR = "system:reservation_sweep";
const DEFAULT_BATCH_LIMIT = 200;

/**
 * The proactive expired-reservation sweep — README's "Expired reservation
 * handling" requirement. `reserve()`'s own lazy reclaim (see
 * `core/catalog/entities.ts#InventoryReservation.expiresAt`'s doc
 * comment) already guarantees correctness with no sweep at all: a
 * product/variant's own expired rows are always reclaimed the next time
 * *that same* product/variant is reserved. This only exists to reclaim
 * capacity *sooner*, for a product nobody else happens to be trying to
 * buy right now — an admin/scheduled action, not something any other
 * Phase 6 use case depends on for correctness. `orders:manage` gates it
 * (matching every other order-adjacent admin action) since a released
 * reservation is functionally the same admin-visible event as
 * `releaseOrderReservation`, just triggered by expiry instead of a
 * button.
 */
export async function expireReservations(
  actor: Session,
  limit: number = DEFAULT_BATCH_LIMIT,
  deps: InventoryReservationDeps = defaultInventoryReservationDeps,
): Promise<{ releasedCount: number }> {
  requirePermission(actor, "orders:manage");

  const expired = await deps.reservations.listExpired(limit);
  for (const reservation of expired) {
    await deps.reservations.release(reservation.orderId, reservation.productId, reservation.variantId, SWEEP_ACTOR);
  }

  if (expired.length > 0) {
    await deps.auditLogs.record({
      type: "inventory_reservation_expired",
      actorUid: actor.uid,
      actorEmail: actor.email,
      metadata: { releasedCount: expired.length },
    });
  }

  return { releasedCount: expired.length };
}

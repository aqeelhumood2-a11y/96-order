import { NotFoundError } from "@/core/errors";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "./dependencies";

/**
 * Per-line reservation input for an order. Deliberately separate from
 * `core/orders/entities.ts`'s `OrderLine` (the customer-facing order
 * snapshot) — `allowBackorder` is an internal operational flag the
 * reservation service needs, not something that belongs in an order's
 * durable customer-facing record. The checkout service builds these from
 * `PricedCart` line snapshots at the moment of order creation.
 */
export interface ReservationLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  allowBackorder: boolean;
  /** An untracked line (unlimited stock) is skipped entirely — there is no `onHand` count to reserve against, the same way `core/cart/rules.ts#priceCartLine` never caps an untracked line's quantity. */
  trackInventory: boolean;
}

/**
 * Reserves every line of an order. Each line's `reserve()` call is its own
 * Firestore transaction (reservations span potentially many
 * product/variant keys, which can't all live in one transaction), so this
 * function is not atomic across lines by itself — if a later line fails
 * (e.g. insufficient stock), every earlier line reserved during this same
 * call is explicitly released before the error is re-thrown, so a failed
 * multi-line reservation attempt never leaves partial stock held.
 * `deps.reservations.reserve()` is itself idempotent per order+product+
 * variant, so retrying a whole failed/duplicate checkout submission is safe.
 */
export async function reserveOrderLines(
  orderId: string,
  lines: ReservationLineInput[],
  expiresAt: Date,
  actorId: string,
  deps: InventoryReservationDeps = defaultInventoryReservationDeps,
): Promise<void> {
  const reservedSoFar: ReservationLineInput[] = [];

  try {
    for (const line of lines) {
      if (!line.trackInventory) continue;

      await deps.reservations.reserve({
        orderId,
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        allowBackorder: line.allowBackorder,
        actorId,
        expiresAt,
      });
      reservedSoFar.push(line);
    }
  } catch (error) {
    for (const line of reservedSoFar) {
      await deps.reservations.release(orderId, line.productId, line.variantId, actorId);
    }
    throw error;
  }

  await deps.auditLogs.record({
    type: "inventory_reserved",
    actorUid: null,
    metadata: { orderId, lineCount: lines.length },
  });
}

/**
 * Releases every still-`reserved` line of an order (a payment that failed,
 * was cancelled, or expired). Idempotent: lines already `released` or
 * `committed` are left untouched, so a repeated call — e.g. a retried
 * webhook — is a safe no-op.
 */
export async function releaseOrderReservations(
  orderId: string,
  actorId: string,
  deps: InventoryReservationDeps = defaultInventoryReservationDeps,
): Promise<void> {
  const reservations = await deps.reservations.listByOrder(orderId);
  for (const reservation of reservations) {
    if (reservation.status !== "reserved") continue;
    await deps.reservations.release(orderId, reservation.productId, reservation.variantId, actorId);
  }

  await deps.auditLogs.record({
    type: "inventory_reservation_released",
    actorUid: null,
    metadata: { orderId },
  });
}

/**
 * Converts every still-`reserved` line of an order into a permanent
 * `onHand` deduction — the paid-order confirmation path and the
 * cash-order admin-confirmation path both call this once the respective
 * business event (verified payment / confirmed cash receipt) has actually
 * occurred. Idempotent: lines already `committed` are left untouched.
 */
export async function commitOrderReservations(
  orderId: string,
  actorId: string,
  deps: InventoryReservationDeps = defaultInventoryReservationDeps,
): Promise<void> {
  const reservations = await deps.reservations.listByOrder(orderId);
  if (reservations.length === 0) {
    throw new NotFoundError(`No reservations found for order ${orderId}.`);
  }

  for (const reservation of reservations) {
    if (reservation.status !== "reserved") continue;
    await deps.reservations.commit(orderId, reservation.productId, reservation.variantId, actorId);
  }
}

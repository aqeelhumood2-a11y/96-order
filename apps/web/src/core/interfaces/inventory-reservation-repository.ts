import type { InventoryReservation } from "@/core/catalog/entities";

export interface ReserveInventoryInput {
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  allowBackorder: boolean;
  actorId: string;
  expiresAt: Date;
}

/**
 * Port for the `inventoryReservations` collection and the transactional
 * mutations it drives on the matching `InventoryRecord.reserved` counter —
 * see `core/catalog/entities.ts`'s "Phase 5 inventory reservations"
 * section and README's Stock reservation lifecycle for the full design.
 */
export interface InventoryReservationRepository {
  /**
   * Idempotent: reserving again for the same `orderId`+`productId`+
   * `variantId` returns the existing reservation unchanged rather than
   * double-reserving. Opportunistically releases this same product/
   * variant's own expired-but-still-"reserved" rows first (see
   * `InventoryReservation.expiresAt`'s doc comment), then throws
   * `ConflictError` if the remaining available stock can't cover
   * `quantity` and `allowBackorder` is false.
   */
  reserve(input: ReserveInventoryInput): Promise<InventoryReservation>;
  /** Idempotent no-op if the reservation doesn't exist or is already `released`/`committed`. */
  release(orderId: string, productId: string, variantId: string | null, actorId: string): Promise<void>;
  /** Idempotent no-op if already `committed`. Converts the reservation into a permanent `onHand` deduction (an `InventoryAdjustment` with reason `"order_fulfilled"`). Throws `ConflictError` if the reservation was already `released`. */
  commit(orderId: string, productId: string, variantId: string | null, actorId: string): Promise<void>;
  listByOrder(orderId: string): Promise<InventoryReservation[]>;
}

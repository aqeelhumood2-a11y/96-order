import type { PublicAvailability } from "@/core/storefront/dto";

export interface AvailabilityRequest {
  productId: string;
  variantId: string | null;
  allowBackorder: boolean;
  trackInventory: boolean;
  lowStockThreshold?: number;
}

/**
 * Storefront-safe inventory reads only — `onHand`/`reserved` and the
 * adjustment ledger never cross this boundary, only the derived
 * `PublicAvailability` booleans (see `core/storefront/rules.ts#computeAvailability`).
 * This is a read-only port; nothing in the storefront ever adjusts stock —
 * see README's Variant selection section for why ("Do not reserve or
 * mutate inventory" is a hard Phase 4 boundary, not just an omission).
 */
export interface PublicInventoryAvailabilityPort {
  getAvailability(request: AvailabilityRequest): Promise<PublicAvailability>;
  /** Batched (one round trip, not N sequential reads) for listing pages that render many products at once. */
  getAvailabilityForMany(requests: readonly AvailabilityRequest[]): Promise<PublicAvailability[]>;
}

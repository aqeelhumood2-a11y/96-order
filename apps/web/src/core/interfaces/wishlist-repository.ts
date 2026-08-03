import type { WishlistItem } from "@/core/wishlist/entities";

/**
 * Port for the `wishlistItems` collection — signed-in customers only.
 * A guest's wishlist is a client-side `localStorage` seam instead (see
 * `features/wishlist/local-wishlist.ts`), merged into this collection on
 * login by replaying one `add()` per locally-stored item — see
 * `features/wishlist/components/merge-guest-wishlist.tsx`'s doc comment
 * for why no server-side "guest wishlist identity" exists to reassign.
 */
export interface WishlistRepository {
  listByCustomer(customerUid: string): Promise<WishlistItem[]>;
  /** Idempotent — adding an already-present item returns the existing row unchanged, never a duplicate. */
  add(customerUid: string, productId: string, variantId: string | null): Promise<WishlistItem>;
  /** Idempotent no-op if the item isn't wishlisted. */
  remove(customerUid: string, productId: string, variantId: string | null): Promise<void>;
}

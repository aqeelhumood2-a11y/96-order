/**
 * One row per (customer, product, variant). Deterministic id
 * (`${customerUid}:${productId}:${variantId ?? "-"}`, the same
 * `cartLineKey` convention `core/cart/rules.ts` uses) makes "add" naturally
 * idempotent — adding an already-wishlisted item twice is a no-op, not a
 * duplicate row — which is what "variant-aware wishlist" means here: a
 * product with variants is wishlisted per variant, not once for the whole
 * product, exactly like a cart line.
 */
export interface WishlistItem {
  id: string;
  customerUid: string;
  productId: string;
  variantId: string | null;
  addedAt: Date;
}

export function wishlistItemId(customerUid: string, productId: string, variantId: string | null): string {
  return `${customerUid}:${productId}:${variantId ?? "-"}`;
}

/** `${productId}:${variantId ?? "-"}` — the membership key shared by the server-side wishlist join and the client-side guest `localStorage` list, so the two are trivially comparable. */
export function wishlistMembershipKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

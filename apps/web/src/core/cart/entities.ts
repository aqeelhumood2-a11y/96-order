/**
 * The stored cart is deliberately minimal — a line only ever carries the
 * client-controllable inputs (`productId`/`variantId`/`quantity`), never a
 * price, name, or availability flag copied from the browser. Every other
 * fact about a line (its current price, whether it's still in stock, its
 * display name/image) is recomputed server-side from live catalog data on
 * every read via `rules.ts#priceCart` — never trusted from what's stored.
 * This is what "the server must rebuild and validate the cart from
 * authoritative catalog data" (Phase 5 spec) means structurally: there is
 * no field here a client could tamper with that would change what a
 * shopper actually gets charged.
 */
export interface CartLine {
  /** Stable per product+variant combination — see `rules.ts#cartLineKey`. Lets "add to cart" merge into an existing line instead of duplicating it. */
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  /**
   * Always `null` in Phase 5 (guest-only checkout) — reserved now so a
   * future authenticated-customer cart merge doesn't need a schema change,
   * just a service that copies guest `lines` into the customer's cart and
   * sets this field. See README's Future customer-account integration seam.
   */
  customerId: string | null;
  lines: CartLine[];
  createdAt: Date;
  updatedAt: Date;
  /** Cart expiry policy — see `config/cart.ts`'s `CART_EXPIRY_MS` for the actual duration. */
  expiresAt: Date;
}

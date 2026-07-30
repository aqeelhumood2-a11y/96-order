import type { Cart } from "@/core/cart/entities";

/**
 * Port for the server-persisted `carts` collection — see README's Cart
 * persistence section for why carts live in Firestore keyed by a signed
 * cookie identifier rather than in browser `localStorage`. `upsert` (not
 * separate `create`/`update`) because the service layer always has a
 * cart id in hand (minted once, from the cookie) and never needs to
 * distinguish "doesn't exist yet" from "exists" before writing — the
 * first write for a given id simply creates it.
 */
export interface CartRepository {
  findById(id: string): Promise<Cart | null>;
  upsert(cart: Cart): Promise<void>;
  delete(id: string): Promise<void>;
}

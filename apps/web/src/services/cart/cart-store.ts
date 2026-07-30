import { CART_EXPIRY_MS } from "@/config/cart";
import type { Cart } from "@/core/cart/entities";
import type { CartDeps } from "./dependencies";

/**
 * Returns the persisted cart, or an unsaved empty one — deliberately does
 * *not* write anything to Firestore just for a read (a guest browsing
 * with an empty cart shouldn't cost a write on every page view). Only a
 * real mutation (`add-to-cart.ts` etc.) actually calls `carts.upsert`.
 */
export async function getCartOrEmpty(cartId: string, deps: CartDeps): Promise<Cart> {
  const existing = await deps.carts.findById(cartId);
  if (existing) return existing;

  const now = new Date();
  return { id: cartId, customerId: null, lines: [], createdAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + CART_EXPIRY_MS) };
}

/** Bumps `updatedAt`/`expiresAt` and persists — every cart-mutating use case ends by calling this. */
export async function saveCart(cart: Cart, deps: CartDeps): Promise<Cart> {
  const now = new Date();
  const next: Cart = { ...cart, updatedAt: now, expiresAt: new Date(now.getTime() + CART_EXPIRY_MS) };
  await deps.carts.upsert(next);
  return next;
}

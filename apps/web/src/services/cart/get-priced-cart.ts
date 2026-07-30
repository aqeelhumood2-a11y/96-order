import type { Cart } from "@/core/cart/entities";
import { priceCart, type PricedCart } from "@/core/cart/rules";
import { buildCatalogSnapshots } from "./catalog-snapshot";
import { getCartOrEmpty } from "./cart-store";
import { defaultCartDeps, type CartDeps } from "./dependencies";

export interface PricedCartResult {
  cart: Cart;
  priced: PricedCart;
}

/**
 * The one read path every cart display (drawer, `/cart` page) and every
 * pre-checkout revalidation goes through — it always rebuilds pricing
 * from *live* catalog data (`buildCatalogSnapshots`), never from anything
 * cached on the stored `Cart` itself, so a price/stock change is reflected
 * immediately the next time this is called.
 */
export async function getPricedCart(cartId: string, deps: CartDeps = defaultCartDeps): Promise<PricedCartResult> {
  const cart = await getCartOrEmpty(cartId, deps);
  const snapshots = await buildCatalogSnapshots(cart.lines, deps);
  return { cart, priced: priceCart(cart, snapshots) };
}

import { priceCart, type PricedCart } from "@/core/cart/rules";
import { buildCatalogSnapshots } from "./catalog-snapshot";
import { getCartOrEmpty, saveCart } from "./cart-store";
import { defaultCartDeps, type CartDeps } from "./dependencies";

export async function clearCart(cartId: string, deps: CartDeps = defaultCartDeps): Promise<PricedCart> {
  const cart = await getCartOrEmpty(cartId, deps);
  const savedCart = await saveCart({ ...cart, lines: [] }, deps);

  const snapshots = await buildCatalogSnapshots(savedCart.lines, deps);
  return priceCart(savedCart, snapshots);
}

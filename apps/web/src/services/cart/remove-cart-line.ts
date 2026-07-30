import { priceCart, type PricedCart, removeCartLine as removeCartLineFromList } from "@/core/cart/rules";
import { buildCatalogSnapshots } from "./catalog-snapshot";
import { getCartOrEmpty, saveCart } from "./cart-store";
import { defaultCartDeps, type CartDeps } from "./dependencies";

export interface RemoveCartLineInput {
  cartId: string;
  lineId: string;
}

export async function removeCartLine(input: RemoveCartLineInput, deps: CartDeps = defaultCartDeps): Promise<PricedCart> {
  const cart = await getCartOrEmpty(input.cartId, deps);
  const nextLines = removeCartLineFromList(cart.lines, input.lineId);
  const savedCart = await saveCart({ ...cart, lines: nextLines }, deps);

  const snapshots = await buildCatalogSnapshots(savedCart.lines, deps);
  return priceCart(savedCart, snapshots);
}

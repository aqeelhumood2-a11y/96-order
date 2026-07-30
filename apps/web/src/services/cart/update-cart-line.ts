import { priceCart, type PricedCart, updateCartLineQuantity } from "@/core/cart/rules";
import { ValidationError } from "@/core/errors";
import { buildCatalogSnapshots } from "./catalog-snapshot";
import { getCartOrEmpty, saveCart } from "./cart-store";
import { defaultCartDeps, type CartDeps } from "./dependencies";

export interface UpdateCartLineInput {
  cartId: string;
  lineId: string;
  quantity: number;
}

/**
 * Only clamps the quantity to `[1, MAX_CART_LINE_QUANTITY]` — it doesn't
 * re-check availability the way `add-to-cart.ts` does, since
 * `core/cart/rules.ts#priceCart` (called by every read path, including
 * this function's own return value) already clamps the *effective*
 * quantity down to what's actually available and flags `quantity_reduced`
 * without needing the stored line itself to be "correct" in the meantime.
 */
export async function updateCartLine(input: UpdateCartLineInput, deps: CartDeps = defaultCartDeps): Promise<PricedCart> {
  if (!Number.isFinite(input.quantity)) {
    throw new ValidationError("Quantity must be a number.");
  }

  const cart = await getCartOrEmpty(input.cartId, deps);
  const nextLines = updateCartLineQuantity(cart.lines, input.lineId, input.quantity);
  const savedCart = await saveCart({ ...cart, lines: nextLines }, deps);

  const snapshots = await buildCatalogSnapshots(savedCart.lines, deps);
  return priceCart(savedCart, snapshots);
}

import type { Cart } from "@/core/cart/entities";
import type { DiscountedPricedCart } from "@/core/pricing/priced-cart";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { defaultCartDeps, type CartDeps } from "@/services/cart/dependencies";
import { defaultPricingDeps, type PricingDeps } from "./dependencies";
import { evaluateCartDiscounts } from "./evaluate-cart-discounts";

export interface DiscountedCartResult {
  cart: Cart;
  priced: DiscountedPricedCart;
}

/**
 * The one place that composes Phase 5's `getPricedCart` (pre-discount) with
 * Phase 7's `evaluateCartDiscounts` — every cart display and checkout call
 * site goes through this rather than each doing the composition itself.
 */
export async function getDiscountedPricedCart(
  cartId: string,
  customerEmail: string | null,
  cartDeps: CartDeps = defaultCartDeps,
  pricingDeps: PricingDeps = defaultPricingDeps,
): Promise<DiscountedCartResult> {
  const { cart, priced } = await getPricedCart(cartId, cartDeps);
  const discounted = await evaluateCartDiscounts(priced, cart, customerEmail, pricingDeps);
  return { cart, priced: discounted };
}

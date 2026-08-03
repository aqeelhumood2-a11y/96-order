import { COUPON_APPLY_RATE_LIMIT } from "@/config/pricing";
import { normalizeCouponCode } from "@/core/coupons/entities";
import { describeCouponRejection } from "@/core/coupons/rules";
import { RateLimitedError, ValidationError } from "@/core/errors";
import { getCartOrEmpty, saveCart } from "@/services/cart/cart-store";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { defaultCartDeps, type CartDeps } from "@/services/cart/dependencies";
import { defaultPricingDeps, type PricingDeps } from "./dependencies";
import { evaluateCartDiscounts } from "./evaluate-cart-discounts";
import { validateCoupon } from "./validate-coupon";
import type { DiscountedCartResult } from "./get-discounted-cart";

/**
 * Validates the code fresh (never trusts that a previously-applied code is
 * still good) and only then stores it on the cart — see `Cart.couponCode`'s
 * doc comment for why the stored value is still just a hint, re-validated
 * on every subsequent read. Rate-limited per cart id (a Server Action has
 * no request object to key an IP-based limit off, unlike the Route
 * Handler-based customer-auth endpoints — see `config/pricing.ts`) so
 * repeatedly submitting this form can't be used to brute-force valid
 * coupon codes.
 */
export async function applyCouponToCart(
  cartId: string,
  code: string,
  customerEmail: string | null,
  cartDeps: CartDeps = defaultCartDeps,
  pricingDeps: PricingDeps = defaultPricingDeps,
): Promise<DiscountedCartResult> {
  const rateResult = await pricingDeps.rateLimiter.consume(`coupon-apply:cart:${cartId}`, COUPON_APPLY_RATE_LIMIT.limit, COUPON_APPLY_RATE_LIMIT.windowSeconds);
  if (!rateResult.allowed) {
    throw new RateLimitedError("Too many attempts. Try again shortly.", { details: { retryAfterSeconds: rateResult.retryAfterSeconds } });
  }

  const { cart, priced } = await getPricedCart(cartId, cartDeps);
  if (priced.lines.length === 0) {
    throw new ValidationError("Your cart is empty.");
  }

  const result = await validateCoupon(code, priced.subtotal, customerEmail, pricingDeps);
  if (!result.ok) {
    throw new ValidationError(describeCouponRejection(result.reason));
  }

  const nextCart = await saveCart({ ...cart, couponCode: normalizeCouponCode(code) }, cartDeps);
  const discounted = await evaluateCartDiscounts(priced, nextCart, customerEmail, pricingDeps);
  return { cart: nextCart, priced: discounted };
}

export async function removeCouponFromCart(cartId: string, cartDeps: CartDeps = defaultCartDeps): Promise<void> {
  const cart = await getCartOrEmpty(cartId, cartDeps);
  await saveCart({ ...cart, couponCode: null }, cartDeps);
}

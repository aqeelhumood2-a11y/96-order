import { add, subtract, ZERO_BHD, type Money } from "@/core/money/money";
import type { PricedCart } from "@/core/cart/rules";
import type { AppliedDiscount, DiscountResult } from "./apply-discounts";

/**
 * `priceCart` (`core/cart/rules.ts`) is deliberately left untouched by
 * Phase 7 — it has no knowledge of coupons/promotions and never will; this
 * function layers the already-computed `DiscountResult` on top of its
 * output instead of the two being merged into one bigger function. That
 * keeps `priceCart`'s existing callers (anything that only needs
 * pre-discount pricing) completely unaffected by this addition.
 *
 * Shipping-threshold decision (Phase 7 spec requirement, documented here
 * since this is the one place pre- and post-discount totals meet): the
 * shipping *fee* is always the one `priceCart` already computed from the
 * **pre-discount** `subtotal` (`core/shipping/rules.ts#computeShippingFee`)
 * — a coupon or promotion can never change which shipping tier a cart
 * lands in, it can only override the fee to zero outright via a
 * `"free_shipping"`-type discount (`discounts.freeShipping`). See
 * `tests/unit/pricing/priced-cart.test.ts` for the boundary cases this
 * guarantees (a cart just above the free-shipping threshold keeps free
 * shipping even after a coupon drops its *discounted* total back below the
 * threshold, and a discount alone — without an explicit free-shipping
 * discount — never zeroes the fee).
 */
export interface DiscountedPricedCart extends Omit<PricedCart, "discountTotal" | "shippingFee" | "grandTotal"> {
  subtotal: Money;
  /** The fee `priceCart` computed pre-discount — always shown alongside `shippingFee` so a free-shipping discount's savings are visible, not just implied by a zero. */
  originalShippingFee: Money;
  shippingFee: Money;
  discountTotal: Money;
  grandTotal: Money;
  appliedDiscounts: AppliedDiscount[];
}

export function applyDiscountsToPricedCart(priced: PricedCart, discounts: DiscountResult): DiscountedPricedCart {
  const shippingFee = discounts.freeShipping ? ZERO_BHD : priced.shippingFee;
  const grandTotal = add(subtract(priced.subtotal, discounts.discountTotal), shippingFee);

  return {
    ...priced,
    originalShippingFee: priced.shippingFee,
    shippingFee,
    discountTotal: discounts.discountTotal,
    grandTotal,
    appliedDiscounts: discounts.applied,
  };
}

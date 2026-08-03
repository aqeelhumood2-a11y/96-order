import { describe, expect, it } from "vitest";
import { money, ZERO_BHD } from "@/core/money/money";
import type { PricedCart } from "@/core/cart/rules";
import { computeShippingFee, FREE_SHIPPING_THRESHOLD, REDUCED_SHIPPING_FEE } from "@/core/shipping/rules";
import { applyDiscountsToPricedCart } from "@/core/pricing/priced-cart";
import type { DiscountResult } from "@/core/pricing/apply-discounts";

function makePricedCart(subtotal: number): PricedCart {
  const subtotalMoney = money(subtotal);
  const shippingFee = computeShippingFee(subtotalMoney);
  return {
    cartId: "cart-1",
    lines: [],
    subtotal: subtotalMoney,
    shippingFee,
    freeShippingUpsell: { achieved: shippingFee.amount === 0, remaining: ZERO_BHD },
    discountTotal: ZERO_BHD,
    grandTotal: money(subtotal + shippingFee.amount),
    hasBlockingIssues: false,
  };
}

function noDiscount(): DiscountResult {
  return { discountTotal: ZERO_BHD, freeShipping: false, applied: [] };
}

describe("applyDiscountsToPricedCart — shipping-threshold boundary (pre-discount subtotal)", () => {
  it("keeps free shipping for a coupon that drops the post-discount total below the threshold", () => {
    // Subtotal just above the free-shipping threshold (BHD 30.001) —
    // pre-discount shipping is already free.
    const priced = makePricedCart(FREE_SHIPPING_THRESHOLD.amount + 1);
    expect(priced.shippingFee).toEqual(ZERO_BHD);

    // A coupon knocks 10 BHD off, landing the *discounted* total well
    // below the threshold — shipping must still be free, because the fee
    // was computed from the pre-discount subtotal and a plain percentage/
    // fixed discount never re-evaluates it.
    const discounts: DiscountResult = { discountTotal: money(10_000), freeShipping: false, applied: [] };
    const result = applyDiscountsToPricedCart(priced, discounts);

    expect(result.shippingFee).toEqual(ZERO_BHD);
    expect(result.originalShippingFee).toEqual(ZERO_BHD);
  });

  it("never grants free shipping from a subtotal discount alone, even if it doesn't reach the threshold", () => {
    // Subtotal in the reduced-fee tier (BHD 15) — well under the free
    // threshold on its own.
    const priced = makePricedCart(15_000);
    expect(priced.shippingFee).toEqual(REDUCED_SHIPPING_FEE);

    // Even a large discount doesn't change the shipping tier — only an
    // explicit `"free_shipping"`-type discount can zero the fee.
    const discounts: DiscountResult = { discountTotal: money(14_999), freeShipping: false, applied: [] };
    const result = applyDiscountsToPricedCart(priced, discounts);

    expect(result.shippingFee).toEqual(REDUCED_SHIPPING_FEE);
  });

  it("zeroes the shipping fee when a free_shipping discount applied, regardless of subtotal tier", () => {
    const priced = makePricedCart(5_000); // standard-fee tier
    const discounts: DiscountResult = { discountTotal: ZERO_BHD, freeShipping: true, applied: [] };
    const result = applyDiscountsToPricedCart(priced, discounts);

    expect(result.shippingFee).toEqual(ZERO_BHD);
    expect(result.originalShippingFee.amount).toBeGreaterThan(0);
  });

  it("subtracts discountTotal from subtotal before adding shipping to compute grandTotal", () => {
    const priced = makePricedCart(20_000);
    const discounts: DiscountResult = { discountTotal: money(5_000), freeShipping: false, applied: [] };
    const result = applyDiscountsToPricedCart(priced, discounts);

    expect(result.grandTotal).toEqual(money(20_000 - 5_000 + priced.shippingFee.amount));
  });

  it("is a no-op on totals when no discount applies", () => {
    const priced = makePricedCart(12_000);
    const result = applyDiscountsToPricedCart(priced, noDiscount());

    expect(result.discountTotal).toEqual(ZERO_BHD);
    expect(result.grandTotal).toEqual(priced.grandTotal);
    expect(result.shippingFee).toEqual(priced.shippingFee);
  });
});

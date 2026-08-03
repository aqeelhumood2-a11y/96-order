import { describe, expect, it } from "vitest";
import { money, ZERO_BHD } from "@/core/money/money";
import { applyDiscounts, type CouponForEvaluation, type PromotionForEvaluation } from "@/core/pricing/apply-discounts";
import type { DiscountLineInput, DiscountScope } from "@/core/pricing/discount-engine";

const NOW = new Date("2026-08-03T00:00:00Z");
const UNRESTRICTED: DiscountScope = { categoryIds: [], brandIds: [] };

const LINES: DiscountLineInput[] = [{ productId: "p1", categoryIds: [], brandId: null, lineTotal: money(20_000) }];
const SUBTOTAL = money(20_000);

function makePromotion(overrides: Partial<PromotionForEvaluation> = {}): PromotionForEvaluation {
  return {
    id: "promo-1",
    name: "10% off",
    type: "percentage",
    value: 10,
    scope: UNRESTRICTED,
    startsAt: null,
    endsAt: null,
    active: true,
    priority: 10,
    stackable: false,
    ...overrides,
  };
}

function makeCoupon(overrides: Partial<CouponForEvaluation> = {}): CouponForEvaluation {
  return {
    code: "SAVE5",
    type: "fixed",
    value: 5_000,
    scope: UNRESTRICTED,
    excludedProductIds: [],
    excludedCategoryIds: [],
    maxDiscountCap: null,
    stackable: false,
    ...overrides,
  };
}

describe("applyDiscounts — promotion eligibility", () => {
  it("ignores an inactive promotion", () => {
    const result = applyDiscounts(LINES, SUBTOTAL, [makePromotion({ active: false })], null, NOW);
    expect(result.discountTotal).toEqual(ZERO_BHD);
  });

  it("ignores a promotion outside its date range", () => {
    const future = makePromotion({ startsAt: new Date("2099-01-01") });
    const past = makePromotion({ id: "promo-2", endsAt: new Date("2020-01-01") });
    const result = applyDiscounts(LINES, SUBTOTAL, [future, past], null, NOW);
    expect(result.discountTotal).toEqual(ZERO_BHD);
    expect(result.applied).toHaveLength(0);
  });

  it("applies a promotion within its date range", () => {
    const promo = makePromotion({ startsAt: new Date("2020-01-01"), endsAt: new Date("2099-01-01") });
    const result = applyDiscounts(LINES, SUBTOTAL, [promo], null, NOW);
    expect(result.discountTotal).toEqual(money(2_000)); // 10% of 20000
  });
});

describe("applyDiscounts — stacking rules", () => {
  it("picks only the lowest-priority non-stackable promotion when multiple are eligible", () => {
    const cheap = makePromotion({ id: "promo-cheap", value: 5, priority: 5, stackable: false });
    const winner = makePromotion({ id: "promo-winner", value: 10, priority: 1, stackable: false });
    const result = applyDiscounts(LINES, SUBTOTAL, [cheap, winner], null, NOW);

    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]!.id).toBe("promo-winner");
    expect(result.discountTotal).toEqual(money(2_000)); // 10% of 20000
  });

  it("drops every stackable promotion when any non-stackable one is eligible", () => {
    const nonStackable = makePromotion({ id: "promo-a", value: 10, stackable: false });
    const stackable = makePromotion({ id: "promo-b", value: 5, stackable: true });
    const result = applyDiscounts(LINES, SUBTOTAL, [nonStackable, stackable], null, NOW);

    expect(result.applied.map((d) => d.id)).toEqual(["promo-a"]);
  });

  it("sums every eligible stackable promotion when none are non-stackable", () => {
    const first = makePromotion({ id: "promo-a", value: 10, stackable: true });
    const second = makePromotion({ id: "promo-b", value: 5, stackable: true });
    const result = applyDiscounts(LINES, SUBTOTAL, [first, second], null, NOW);

    expect(result.applied).toHaveLength(2);
    expect(result.discountTotal).toEqual(money(3_000)); // 10% + 5% of 20000
  });

  it("a stackable coupon adds on top of the selected promotion", () => {
    const promo = makePromotion({ value: 10, stackable: false });
    const coupon = makeCoupon({ value: 5_000, stackable: true });
    const result = applyDiscounts(LINES, SUBTOTAL, [promo], coupon, NOW);

    expect(result.applied.map((d) => d.source)).toEqual(["promotion", "coupon"]);
    expect(result.discountTotal).toEqual(money(2_000 + 5_000));
  });

  it("a non-stackable coupon replaces every promotion entirely", () => {
    const promo = makePromotion({ value: 10, stackable: false });
    const coupon = makeCoupon({ value: 5_000, stackable: false });
    const result = applyDiscounts(LINES, SUBTOTAL, [promo], coupon, NOW);

    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]!.source).toBe("coupon");
    expect(result.discountTotal).toEqual(money(5_000));
  });

  it("caps discountTotal at the cart subtotal even if applied discounts would exceed it", () => {
    const promo = makePromotion({ value: 90, stackable: true });
    const coupon = makeCoupon({ value: 15_000, stackable: true });
    const result = applyDiscounts(LINES, SUBTOTAL, [promo], coupon, NOW);

    expect(result.discountTotal.amount).toBeLessThanOrEqual(SUBTOTAL.amount);
  });

  it("reports freeShipping when a free_shipping promotion is selected", () => {
    const promo = makePromotion({ type: "free_shipping", value: 0 });
    const result = applyDiscounts(LINES, SUBTOTAL, [promo], null, NOW);
    expect(result.freeShipping).toBe(true);
    expect(result.discountTotal).toEqual(ZERO_BHD);
  });

  it("reports freeShipping when a free_shipping coupon is applied", () => {
    const coupon = makeCoupon({ type: "free_shipping", value: 0 });
    const result = applyDiscounts(LINES, SUBTOTAL, [], coupon, NOW);
    expect(result.freeShipping).toBe(true);
  });
});

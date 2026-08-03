import { describe, expect, it } from "vitest";
import { money, ZERO_BHD } from "@/core/money/money";
import { computeScopedDiscountAmount, lineMatchesScope, type DiscountLineInput, type DiscountScope } from "@/core/pricing/discount-engine";

const UNRESTRICTED: DiscountScope = { categoryIds: [], brandIds: [] };

function makeLine(overrides: Partial<DiscountLineInput> = {}): DiscountLineInput {
  return { productId: "p1", categoryIds: ["cat-coffee"], brandId: "brand-a", lineTotal: money(10_000), ...overrides };
}

describe("lineMatchesScope", () => {
  it("matches every line when the scope is unrestricted", () => {
    expect(lineMatchesScope(makeLine(), UNRESTRICTED, [], [])).toBe(true);
  });

  it("matches on category", () => {
    const scope: DiscountScope = { categoryIds: ["cat-coffee"], brandIds: [] };
    expect(lineMatchesScope(makeLine({ categoryIds: ["cat-coffee"] }), scope, [], [])).toBe(true);
    expect(lineMatchesScope(makeLine({ categoryIds: ["cat-equipment"] }), scope, [], [])).toBe(false);
  });

  it("matches on brand", () => {
    const scope: DiscountScope = { categoryIds: [], brandIds: ["brand-a"] };
    expect(lineMatchesScope(makeLine({ brandId: "brand-a" }), scope, [], [])).toBe(true);
    expect(lineMatchesScope(makeLine({ brandId: "brand-b" }), scope, [], [])).toBe(false);
    expect(lineMatchesScope(makeLine({ brandId: null }), scope, [], [])).toBe(false);
  });

  it("excludes a product even when the scope would otherwise match", () => {
    expect(lineMatchesScope(makeLine({ productId: "p1" }), UNRESTRICTED, ["p1"], [])).toBe(false);
  });

  it("excludes a category even when the scope would otherwise match", () => {
    expect(lineMatchesScope(makeLine({ categoryIds: ["cat-coffee"] }), UNRESTRICTED, [], ["cat-coffee"])).toBe(false);
  });
});

describe("computeScopedDiscountAmount", () => {
  it("percentage: rounds to the nearest fils", () => {
    const lines = [makeLine({ lineTotal: money(1_999) })];
    // 15% of 1999 = 299.85 -> rounds to 300
    expect(computeScopedDiscountAmount(lines, "percentage", 15, null, UNRESTRICTED, [], [])).toEqual(money(300));
  });

  it("percentage: caps at maxDiscountCap", () => {
    const lines = [makeLine({ lineTotal: money(100_000) })];
    // 50% of 100000 = 50000, capped to 10000
    expect(computeScopedDiscountAmount(lines, "percentage", 50, money(10_000), UNRESTRICTED, [], [])).toEqual(money(10_000));
  });

  it("fixed: never exceeds the eligible subtotal", () => {
    const lines = [makeLine({ lineTotal: money(3_000) })];
    expect(computeScopedDiscountAmount(lines, "fixed", 10_000, null, UNRESTRICTED, [], [])).toEqual(money(3_000));
  });

  it("fixed: only counts scoped-eligible lines toward the cap", () => {
    const lines = [makeLine({ productId: "p1", categoryIds: ["cat-coffee"], lineTotal: money(3_000) }), makeLine({ productId: "p2", categoryIds: ["cat-equipment"], lineTotal: money(50_000) })];
    const scope: DiscountScope = { categoryIds: ["cat-coffee"], brandIds: [] };
    // Only p1 (3000) is in scope, so a 10000 fixed discount is capped to 3000, not 53000.
    expect(computeScopedDiscountAmount(lines, "fixed", 10_000, null, scope, [], [])).toEqual(money(3_000));
  });

  it("free_shipping: always zero — its effect is on the shipping fee, not the subtotal", () => {
    const lines = [makeLine({ lineTotal: money(50_000) })];
    expect(computeScopedDiscountAmount(lines, "free_shipping", 0, null, UNRESTRICTED, [], [])).toEqual(ZERO_BHD);
  });

  it("returns zero when nothing is eligible", () => {
    const lines = [makeLine({ categoryIds: ["cat-equipment"] })];
    const scope: DiscountScope = { categoryIds: ["cat-coffee"], brandIds: [] };
    expect(computeScopedDiscountAmount(lines, "percentage", 20, null, scope, [], [])).toEqual(ZERO_BHD);
  });
});

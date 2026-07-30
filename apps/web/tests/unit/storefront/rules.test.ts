import { describe, expect, it } from "vitest";
import {
  computeAvailability,
  findMatchingVariant,
  getAvailableAttributeValues,
  isBrandPublic,
  isCategoryPublic,
  isPubliclyVisible,
  isWithinPriceRange,
  listVariantAttributeNames,
  matchesAvailabilityFilter,
  selectRelatedProducts,
} from "@/core/storefront/rules";
import type { PublicProductSummary, PublicVariant } from "@/core/storefront/dto";

function makeVariant(overrides: Partial<PublicVariant> = {}): PublicVariant {
  return {
    id: "variant-1",
    sku: "SKU-1",
    attributeSelections: {},
    price: 1000,
    availability: { inStock: true, lowStock: false },
    ...overrides,
  };
}

function makeSummary(overrides: Partial<PublicProductSummary> = {}): PublicProductSummary {
  return {
    id: "product-1",
    slug: "product-1",
    name: "Product 1",
    brand: null,
    primaryCategory: { name: "Coffee", slug: "coffee" },
    productType: "coffee",
    tags: [],
    featured: false,
    primaryImage: null,
    displayPrice: 1000,
    hasVariants: false,
    availability: { inStock: true, lowStock: false },
    createdAt: new Date(),
    ...overrides,
  };
}

describe("isPubliclyVisible", () => {
  it("requires both active status and visible visibility", () => {
    expect(isPubliclyVisible({ status: "active", visibility: "visible" })).toBe(true);
    expect(isPubliclyVisible({ status: "draft", visibility: "visible" })).toBe(false);
    expect(isPubliclyVisible({ status: "active", visibility: "hidden" })).toBe(false);
    expect(isPubliclyVisible({ status: "archived", visibility: "hidden" })).toBe(false);
  });
});

describe("isCategoryPublic / isBrandPublic", () => {
  it("mirrors the isActive flag", () => {
    expect(isCategoryPublic({ isActive: true })).toBe(true);
    expect(isCategoryPublic({ isActive: false })).toBe(false);
    expect(isBrandPublic({ isActive: true })).toBe(true);
    expect(isBrandPublic({ isActive: false })).toBe(false);
  });
});

describe("computeAvailability", () => {
  it("treats untracked inventory as always in stock", () => {
    expect(computeAvailability(null, false, false)).toEqual({ inStock: true, lowStock: false });
    expect(computeAvailability({ onHand: 0, reserved: 0 }, false, false)).toEqual({ inStock: true, lowStock: false });
  });

  it("is out of stock when nothing is available and backorder isn't allowed", () => {
    expect(computeAvailability({ onHand: 2, reserved: 2 }, false, true)).toEqual({ inStock: false, lowStock: false });
  });

  it("stays in stock when backorder is allowed even with nothing available", () => {
    expect(computeAvailability({ onHand: 0, reserved: 0 }, true, true)).toEqual({ inStock: true, lowStock: false });
  });

  it("flags low stock only when in stock and at/under the threshold", () => {
    expect(computeAvailability({ onHand: 5, reserved: 3, lowStockThreshold: 2 }, false, true)).toEqual({ inStock: true, lowStock: true });
    expect(computeAvailability({ onHand: 10, reserved: 2, lowStockThreshold: 2 }, false, true)).toEqual({ inStock: true, lowStock: false });
  });

  it("never reports low stock when out of stock", () => {
    expect(computeAvailability({ onHand: 0, reserved: 0, lowStockThreshold: 5 }, false, true)).toEqual({ inStock: false, lowStock: false });
  });
});

describe("findMatchingVariant", () => {
  const variants = [
    makeVariant({ id: "v1", attributeSelections: { size: "250g", grind: "whole-bean" } }),
    makeVariant({ id: "v2", attributeSelections: { size: "500g", grind: "whole-bean" } }),
  ];

  it("finds the variant whose selections match exactly", () => {
    expect(findMatchingVariant(variants, { size: "250g", grind: "whole-bean" })?.id).toBe("v1");
  });

  it("returns null for a partial or non-existent combination", () => {
    expect(findMatchingVariant(variants, { size: "250g" })).toBeNull();
    expect(findMatchingVariant(variants, { size: "1kg", grind: "whole-bean" })).toBeNull();
  });
});

describe("getAvailableAttributeValues", () => {
  const variants = [
    makeVariant({ id: "v1", attributeSelections: { size: "250g", grind: "whole-bean" } }),
    makeVariant({ id: "v2", attributeSelections: { size: "250g", grind: "ground" } }),
    makeVariant({ id: "v3", attributeSelections: { size: "500g", grind: "whole-bean" } }),
  ];

  it("returns every value reachable given no other selection", () => {
    expect(getAvailableAttributeValues(variants, {}, "size")).toEqual(new Set(["250g", "500g"]));
  });

  it("narrows to values consistent with the other current selections", () => {
    expect(getAvailableAttributeValues(variants, { grind: "ground" }, "size")).toEqual(new Set(["250g"]));
    expect(getAvailableAttributeValues(variants, { size: "500g" }, "grind")).toEqual(new Set(["whole-bean"]));
  });

  it("ignores the attribute's own current selection when computing its own reachable set", () => {
    expect(getAvailableAttributeValues(variants, { size: "250g" }, "size")).toEqual(new Set(["250g", "500g"]));
  });
});

describe("listVariantAttributeNames", () => {
  it("lists every distinct attribute name in first-seen order", () => {
    const variants = [
      makeVariant({ attributeSelections: { size: "250g", grind: "whole-bean" } }),
      makeVariant({ attributeSelections: { grind: "ground", roast: "dark" } }),
    ];
    expect(listVariantAttributeNames(variants)).toEqual(["size", "grind", "roast"]);
  });

  it("returns an empty array for variants with no attributes", () => {
    expect(listVariantAttributeNames([makeVariant({ attributeSelections: {} })])).toEqual([]);
  });
});

describe("isWithinPriceRange", () => {
  it("passes when no bounds are given", () => {
    expect(isWithinPriceRange(500, undefined, undefined)).toBe(true);
  });

  it("enforces the lower bound", () => {
    expect(isWithinPriceRange(500, 600, undefined)).toBe(false);
    expect(isWithinPriceRange(600, 600, undefined)).toBe(true);
  });

  it("enforces the upper bound", () => {
    expect(isWithinPriceRange(700, undefined, 600)).toBe(false);
    expect(isWithinPriceRange(600, undefined, 600)).toBe(true);
  });
});

describe("matchesAvailabilityFilter", () => {
  it("passes everything when the filter is undefined or 'all'", () => {
    expect(matchesAvailabilityFilter({ inStock: false, lowStock: false }, undefined)).toBe(true);
    expect(matchesAvailabilityFilter({ inStock: false, lowStock: false }, "all")).toBe(true);
  });

  it("requires in-stock when the filter is 'in_stock'", () => {
    expect(matchesAvailabilityFilter({ inStock: true, lowStock: false }, "in_stock")).toBe(true);
    expect(matchesAvailabilityFilter({ inStock: false, lowStock: false }, "in_stock")).toBe(false);
  });
});

describe("selectRelatedProducts", () => {
  it("excludes the current product and caps the result", () => {
    const candidates = [makeSummary({ id: "a" }), makeSummary({ id: "current" }), makeSummary({ id: "b" }), makeSummary({ id: "c" })];
    const result = selectRelatedProducts(candidates, "current", 2);
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

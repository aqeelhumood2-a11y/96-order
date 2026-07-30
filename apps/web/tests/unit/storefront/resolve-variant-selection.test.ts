import { describe, expect, it } from "vitest";
import { resolveVariantSelection } from "@/features/storefront/detail/resolve-variant-selection";
import type { PublicVariant } from "@/core/storefront/dto";

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

describe("resolveVariantSelection", () => {
  it("returns the single implicit variant when there are no variant attributes", () => {
    const variants = [makeVariant({ attributeSelections: {} })];
    const result = resolveVariantSelection(variants, {});
    expect(result.attributeNames).toEqual([]);
    expect(result.matchedVariant).toBe(variants[0]);
  });

  it("defaults to the first variant's own combination when the URL has no selection", () => {
    const variants = [
      makeVariant({ id: "v1", attributeSelections: { size: "250g" } }),
      makeVariant({ id: "v2", attributeSelections: { size: "500g" } }),
    ];
    const result = resolveVariantSelection(variants, {});
    expect(result.selections).toEqual({ size: "250g" });
    expect(result.matchedVariant?.id).toBe("v1");
  });

  it("resolves the variant matching a full valid selection from the URL", () => {
    const variants = [
      makeVariant({ id: "v1", attributeSelections: { size: "250g" } }),
      makeVariant({ id: "v2", attributeSelections: { size: "500g" } }),
    ];
    const result = resolveVariantSelection(variants, { size: "500g" });
    expect(result.matchedVariant?.id).toBe("v2");
  });

  it("drops unknown attribute names from the URL rather than trusting them", () => {
    const variants = [makeVariant({ id: "v1", attributeSelections: { size: "250g" } })];
    const result = resolveVariantSelection(variants, { size: "250g", bogus: "value" });
    expect(result.selections).toEqual({ size: "250g" });
  });

  it("returns null for a partial or invalid combination", () => {
    const variants = [
      makeVariant({ id: "v1", attributeSelections: { size: "250g", grind: "whole-bean" } }),
      makeVariant({ id: "v2", attributeSelections: { size: "500g", grind: "ground" } }),
    ];
    const result = resolveVariantSelection(variants, { size: "250g", grind: "ground" });
    expect(result.matchedVariant).toBeNull();
  });
});

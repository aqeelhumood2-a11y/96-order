import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors";
import { assertNoDuplicateCategoryAssignment, validateVariantsInput } from "@/services/catalog/product-validation";
import { variantInputSchema } from "@/core/catalog/schemas";

function variant(overrides: Partial<Parameters<typeof variantInputSchema.parse>[0]> = {}) {
  return variantInputSchema.parse({
    sku: "SKU-A",
    attributeSelections: { size: "500g" },
    ...overrides,
  });
}

describe("validateVariantsInput", () => {
  it("passes for a valid, non-duplicating set of variants", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", undefined, [
        variant({ sku: "SKU-A", attributeSelections: { size: "500g" } }),
        variant({ sku: "SKU-B", attributeSelections: { size: "1kg" } }),
      ]),
    ).not.toThrow();
  });

  it("rejects a variant SKU that duplicates the product's own SKU", () => {
    expect(() => validateVariantsInput("SKU-A", undefined, [variant({ sku: "sku-a" })])).toThrow(ValidationError);
  });

  it("rejects two variants sharing the same SKU (case-insensitively)", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", undefined, [
        variant({ sku: "SKU-A", attributeSelections: { size: "500g" } }),
        variant({ sku: "sku-a", attributeSelections: { size: "1kg" } }),
      ]),
    ).toThrow(ValidationError);
  });

  it("rejects two variants sharing the same barcode", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", undefined, [
        variant({ sku: "SKU-A", barcode: "111", attributeSelections: { size: "500g" } }),
        variant({ sku: "SKU-B", barcode: "111", attributeSelections: { size: "1kg" } }),
      ]),
    ).toThrow(ValidationError);
  });

  it("rejects a variant barcode that duplicates the product's own barcode", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", "999", [variant({ sku: "SKU-A", barcode: "999" })]),
    ).toThrow(ValidationError);
  });

  it("rejects two variants with the same attribute combination even with different SKUs", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", undefined, [
        variant({ sku: "SKU-A", attributeSelections: { size: "500g" } }),
        variant({ sku: "SKU-B", attributeSelections: { Size: " 500G " } }),
      ]),
    ).toThrow(ValidationError);
  });

  it("rejects a variant whose compare-at override is not greater than its price override", () => {
    expect(() =>
      validateVariantsInput("PARENT-SKU", undefined, [
        variant({ sku: "SKU-A", priceOverride: 1000, compareAtPriceOverride: 900 }),
      ]),
    ).toThrow(ValidationError);
  });
});

describe("assertNoDuplicateCategoryAssignment", () => {
  it("rejects the primary category also appearing in additionalCategoryIds", () => {
    expect(() => assertNoDuplicateCategoryAssignment("cat-1", ["cat-1", "cat-2"])).toThrow(ValidationError);
  });

  it("allows a primary category and disjoint additional categories", () => {
    expect(() => assertNoDuplicateCategoryAssignment("cat-1", ["cat-2", "cat-3"])).not.toThrow();
  });

  it("allows an empty additionalCategoryIds list", () => {
    expect(() => assertNoDuplicateCategoryAssignment("cat-1", [])).not.toThrow();
  });
});

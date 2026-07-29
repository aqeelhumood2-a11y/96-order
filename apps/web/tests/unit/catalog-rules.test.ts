import { describe, expect, it } from "vitest";
import {
  canDecreaseStock,
  computeAvailableQuantity,
  hasDuplicateVariantCombination,
  isCompareAtPriceValid,
  normalizeCatalogCode,
  variantSelectionsKey,
  wouldCreateCircularCategoryReference,
} from "@/core/catalog/rules";
import type { ProductVariant } from "@/core/catalog/entities";

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "variant-1",
    sku: "SKU-1",
    attributeSelections: {},
    status: "active",
    trackInventory: true,
    allowBackorder: false,
    ...overrides,
  };
}

describe("computeAvailableQuantity", () => {
  it("subtracts reserved from on-hand", () => {
    expect(computeAvailableQuantity({ onHand: 10, reserved: 3 })).toBe(7);
  });

  it("can go negative if reserved exceeds on-hand", () => {
    expect(computeAvailableQuantity({ onHand: 2, reserved: 5 })).toBe(-3);
  });
});

describe("canDecreaseStock", () => {
  it("allows a decrease that keeps available at or above zero", () => {
    expect(canDecreaseStock({ onHand: 10, reserved: 2 }, 8, false)).toBe(true);
  });

  it("denies a decrease that would take available negative when backorder is disallowed", () => {
    expect(canDecreaseStock({ onHand: 10, reserved: 2 }, 9, false)).toBe(false);
  });

  it("allows any decrease when backorder is allowed, even deeply negative", () => {
    expect(canDecreaseStock({ onHand: 1, reserved: 0 }, 100, true)).toBe(true);
  });

  it("allows a decrease that lands exactly at zero available", () => {
    expect(canDecreaseStock({ onHand: 5, reserved: 0 }, 5, false)).toBe(true);
  });
});

describe("variantSelectionsKey", () => {
  it("is order-independent", () => {
    const a = variantSelectionsKey({ bagSize: "500g", grind: "wholeBean" });
    const b = variantSelectionsKey({ grind: "wholeBean", bagSize: "500g" });
    expect(a).toBe(b);
  });

  it("is case- and whitespace-insensitive", () => {
    const a = variantSelectionsKey({ BagSize: " 500G " });
    const b = variantSelectionsKey({ bagsize: "500g" });
    expect(a).toBe(b);
  });

  it("distinguishes different selections", () => {
    const a = variantSelectionsKey({ bagSize: "500g" });
    const b = variantSelectionsKey({ bagSize: "1kg" });
    expect(a).not.toBe(b);
  });
});

describe("hasDuplicateVariantCombination", () => {
  it("detects a duplicate combination among existing variants", () => {
    const variants = [makeVariant({ id: "v1", attributeSelections: { bagSize: "500g" } })];
    expect(hasDuplicateVariantCombination(variants, { bagSize: "500g" })).toBe(true);
  });

  it("does not flag a variant against itself when excluded", () => {
    const variants = [makeVariant({ id: "v1", attributeSelections: { bagSize: "500g" } })];
    expect(hasDuplicateVariantCombination(variants, { bagSize: "500g" }, "v1")).toBe(false);
  });

  it("returns false for a genuinely new combination", () => {
    const variants = [makeVariant({ id: "v1", attributeSelections: { bagSize: "500g" } })];
    expect(hasDuplicateVariantCombination(variants, { bagSize: "1kg" })).toBe(false);
  });
});

describe("normalizeCatalogCode", () => {
  it("trims and upper-cases", () => {
    expect(normalizeCatalogCode("  sku-abc-123 ")).toBe("SKU-ABC-123");
  });
});

describe("isCompareAtPriceValid", () => {
  it("passes when no compare-at price is set", () => {
    expect(isCompareAtPriceValid(1000, undefined)).toBe(true);
  });

  it("requires the compare-at price to be strictly greater than the base price", () => {
    expect(isCompareAtPriceValid(1000, 1200)).toBe(true);
    expect(isCompareAtPriceValid(1000, 1000)).toBe(false);
    expect(isCompareAtPriceValid(1000, 900)).toBe(false);
  });
});

describe("wouldCreateCircularCategoryReference", () => {
  it("rejects a category being made its own parent", async () => {
    const result = await wouldCreateCircularCategoryReference("cat-1", "cat-1", async () => null);
    expect(result).toBe(true);
  });

  it("allows a null (top-level) parent", async () => {
    const result = await wouldCreateCircularCategoryReference("cat-1", null, async () => null);
    expect(result).toBe(false);
  });

  it("detects an indirect cycle by walking up the chain", async () => {
    // cat-3's parent is cat-2, cat-2's parent is cat-1 — assigning cat-1's
    // parent to cat-3 would close the loop.
    const tree: Record<string, { id: string; parentId: string | null }> = {
      "cat-3": { id: "cat-3", parentId: "cat-2" },
      "cat-2": { id: "cat-2", parentId: "cat-1" },
    };
    const result = await wouldCreateCircularCategoryReference("cat-1", "cat-3", async (id) => tree[id] ?? null);
    expect(result).toBe(true);
  });

  it("allows a legitimate reparenting that doesn't close a loop", async () => {
    const tree: Record<string, { id: string; parentId: string | null }> = {
      "cat-2": { id: "cat-2", parentId: null },
    };
    const result = await wouldCreateCircularCategoryReference("cat-1", "cat-2", async (id) => tree[id] ?? null);
    expect(result).toBe(false);
  });

  it("terminates within maxDepth even against a corrupt/cyclic tree already in storage", async () => {
    // cat-a <-> cat-b point at each other — a real bug elsewhere, but this
    // check must not hang forever walking it.
    const tree: Record<string, { id: string; parentId: string | null }> = {
      "cat-a": { id: "cat-a", parentId: "cat-b" },
      "cat-b": { id: "cat-b", parentId: "cat-a" },
    };
    const result = await wouldCreateCircularCategoryReference("unrelated", "cat-a", async (id) => tree[id] ?? null, 5);
    expect(result).toBe(false);
  });
});

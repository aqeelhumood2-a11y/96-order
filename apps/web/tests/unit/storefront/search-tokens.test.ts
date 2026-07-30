import { describe, expect, it } from "vitest";
import { buildSearchTokens, matchesAllQueryWords, tokenizeQuery } from "@/core/catalog/rules";

describe("buildSearchTokens", () => {
  it("builds prefix tokens (min length 2) from the product name", () => {
    const tokens = buildSearchTokens({ name: "Ethiopia", sku: "ETH-1", tags: [], productType: "coffee" });
    expect(tokens).toEqual(expect.arrayContaining(["et", "eth", "ethi", "ethio", "ethiop", "ethiopi", "ethiopia"]));
  });

  it("includes the exact lowercased SKU and barcode as whole tokens, not just prefixes", () => {
    const tokens = buildSearchTokens({ name: "Product", sku: "ETH-YIRG-250", barcode: "012345", tags: [], productType: "coffee" });
    expect(tokens).toContain("eth-yirg-250");
    expect(tokens).toContain("012345");
  });

  it("includes brand, category, tags, and variant SKUs", () => {
    const tokens = buildSearchTokens({
      name: "Roast",
      sku: "SKU-1",
      tags: ["single-origin"],
      productType: "coffee",
      brandName: "Acme Roasters",
      categoryName: "Whole Bean",
      variantSkus: ["SKU-1-A"],
    });
    expect(tokens).toContain("sku-1-a");
    expect(tokens).toEqual(expect.arrayContaining(["ac", "acm", "acme", "wh", "who", "whol", "whole", "si", "sin", "single"]));
  });

  it("drops words shorter than the minimum word length", () => {
    const tokens = buildSearchTokens({ name: "A B Coffee", sku: "SKU-2", tags: [], productType: "coffee" });
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("b");
  });

  it("is diacritic-insensitive", () => {
    const tokens = buildSearchTokens({ name: "Café", sku: "SKU-3", tags: [], productType: "coffee" });
    expect(tokens).toEqual(expect.arrayContaining(["ca", "caf", "cafe"]));
  });

  it("caps the number of tokens per product", () => {
    const manyTags = Array.from({ length: 100 }, (_, index) => `uniquetagvalue${index}`);
    const tokens = buildSearchTokens({ name: "Product", sku: "SKU-4", tags: manyTags, productType: "coffee" });
    expect(tokens.length).toBeLessThanOrEqual(300);
  });

  it("deduplicates tokens shared across fields", () => {
    const tokens = buildSearchTokens({ name: "Coffee", sku: "SKU-5", tags: ["coffee"], productType: "coffee" });
    expect(tokens.filter((token) => token === "coffee")).toHaveLength(1);
  });
});

describe("tokenizeQuery", () => {
  it("lowercases and splits on non-alphanumeric characters", () => {
    expect(tokenizeQuery("Ethiopia Yirgacheffe!")).toEqual(["ethiopia", "yirgacheffe"]);
  });

  it("drops words shorter than the minimum length", () => {
    expect(tokenizeQuery("a coffee")).toEqual(["coffee"]);
  });

  it("returns an empty array for a query with no valid words", () => {
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("matchesAllQueryWords", () => {
  it("requires every query word to appear as a substring somewhere in the haystack", () => {
    const haystack = ["Ethiopia Yirgacheffe", "coffee", "Acme Roasters"];
    expect(matchesAllQueryWords(haystack, ["yirg", "acme"])).toBe(true);
    expect(matchesAllQueryWords(haystack, ["yirg", "missing"])).toBe(false);
  });

  it("lowercases the haystack, but expects query words already lowercased (as tokenizeQuery produces)", () => {
    expect(matchesAllQueryWords(["Ethiopia"], ["ethiopia"])).toBe(true);
    expect(matchesAllQueryWords(["Ethiopia"], ["ETHIOPIA"])).toBe(false);
  });

  it("passes trivially when there are no query words", () => {
    expect(matchesAllQueryWords(["anything"], [])).toBe(true);
  });
});

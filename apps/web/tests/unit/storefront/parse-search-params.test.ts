import { describe, expect, it } from "vitest";
import { firstValue, parseListingSearchParams, parseView } from "@/features/storefront/listing/parse-search-params";

describe("firstValue", () => {
  it("passes through a single string", () => {
    expect(firstValue("coffee")).toBe("coffee");
  });

  it("takes the first entry of a repeated param", () => {
    expect(firstValue(["a", "b"])).toBe("a");
  });

  it("passes through undefined", () => {
    expect(firstValue(undefined)).toBeUndefined();
  });
});

describe("parseListingSearchParams", () => {
  it("converts minPriceBhd/maxPriceBhd major-unit amounts to minor-unit (fils) minPrice/maxPrice", () => {
    const query = parseListingSearchParams({ minPriceBhd: "5", maxPriceBhd: "15" });
    expect(query.minPrice).toBe(5000);
    expect(query.maxPrice).toBe(15000);
  });

  it("falls back to defaults (no filters) on a malformed query instead of throwing", () => {
    const query = parseListingSearchParams({ sort: "not-a-real-sort" });
    expect(query.sort).toBe("newest");
    expect(query.category).toBeUndefined();
  });

  it("passes through recognized filters", () => {
    const query = parseListingSearchParams({ category: "coffee", productType: "coffee", availability: "in_stock" });
    expect(query.category).toBe("coffee");
    expect(query.productType).toBe("coffee");
    expect(query.availability).toBe("in_stock");
  });
});

describe("parseView", () => {
  it("defaults to grid", () => {
    expect(parseView({})).toBe("grid");
    expect(parseView({ view: "something-else" })).toBe("grid");
  });

  it("recognizes list", () => {
    expect(parseView({ view: "list" })).toBe("list");
  });
});

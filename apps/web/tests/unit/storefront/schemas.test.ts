import { describe, expect, it } from "vitest";
import { listProductsQuerySchema, MIN_SEARCH_QUERY_LENGTH, searchQuerySchema, variantSelectionQuerySchema } from "@/core/storefront/schemas";

describe("listProductsQuerySchema", () => {
  it("defaults sort to newest and limit to 24 when omitted", () => {
    const result = listProductsQuerySchema.parse({});
    expect(result.sort).toBe("newest");
    expect(result.limit).toBe(24);
  });

  it("coerces numeric string filters", () => {
    const result = listProductsQuerySchema.parse({ minPrice: "500", maxPrice: "1500", limit: "10" });
    expect(result.minPrice).toBe(500);
    expect(result.maxPrice).toBe(1500);
    expect(result.limit).toBe(10);
  });

  it("transforms the featured flag from a string to a boolean", () => {
    expect(listProductsQuerySchema.parse({ featured: "true" }).featured).toBe(true);
    expect(listProductsQuerySchema.parse({ featured: "false" }).featured).toBe(false);
    expect(listProductsQuerySchema.parse({}).featured).toBeUndefined();
  });

  it("rejects an unknown sort option", () => {
    expect(listProductsQuerySchema.safeParse({ sort: "not-a-sort" }).success).toBe(false);
  });

  it("rejects a limit above the cap of 60", () => {
    expect(listProductsQuerySchema.safeParse({ limit: 61 }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(listProductsQuerySchema.safeParse({ minPrice: -5 }).success).toBe(false);
  });

  it("rejects an unknown availability value", () => {
    expect(listProductsQuerySchema.safeParse({ availability: "sold_out" }).success).toBe(false);
  });
});

describe("searchQuerySchema", () => {
  it("rejects a query shorter than the minimum length", () => {
    const tooShort = "a".repeat(MIN_SEARCH_QUERY_LENGTH - 1);
    expect(searchQuerySchema.safeParse({ q: tooShort }).success).toBe(false);
  });

  it("accepts a query at exactly the minimum length", () => {
    const exact = "a".repeat(MIN_SEARCH_QUERY_LENGTH);
    expect(searchQuerySchema.safeParse({ q: exact }).success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = searchQuerySchema.parse({ q: "  coffee  " });
    expect(result.q).toBe("coffee");
  });

  it("rejects a missing query", () => {
    expect(searchQuerySchema.safeParse({}).success).toBe(false);
  });
});

describe("variantSelectionQuerySchema", () => {
  it("accepts a record of non-empty string keys and values", () => {
    expect(variantSelectionQuerySchema.safeParse({ size: "250g", grind: "whole-bean" }).success).toBe(true);
  });

  it("rejects an empty-string value", () => {
    expect(variantSelectionQuerySchema.safeParse({ size: "" }).success).toBe(false);
  });
});

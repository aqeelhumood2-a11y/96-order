import { describe, expect, it } from "vitest";
import {
  buildFilterQueryString,
  nextPageHref,
  parseCursorState,
  prevPageHref,
  viewToggleHref,
} from "@/features/storefront/listing/query-utils";
import { listProductsQuerySchema } from "@/core/storefront/schemas";

describe("buildFilterQueryString", () => {
  it("omits fields at their default value", () => {
    const query = listProductsQuerySchema.parse({});
    expect(buildFilterQueryString(query)).toBe("");
  });

  it("converts minor-unit prices back to dollar amounts", () => {
    const query = listProductsQuerySchema.parse({ minPrice: 500, maxPrice: 1500 });
    const qs = buildFilterQueryString(query);
    expect(qs).toContain("minPriceUsd=5");
    expect(qs).toContain("maxPriceUsd=15");
  });

  it("includes non-default filters", () => {
    const query = listProductsQuerySchema.parse({ category: "coffee", brand: "acme", sort: "price_asc", featured: "true" });
    const qs = buildFilterQueryString(query);
    const params = new URLSearchParams(qs);
    expect(params.get("category")).toBe("coffee");
    expect(params.get("brand")).toBe("acme");
    expect(params.get("sort")).toBe("price_asc");
    expect(params.get("featured")).toBe("true");
  });
});

describe("parseCursorState", () => {
  it("parses an empty state when nothing is present", () => {
    expect(parseCursorState(undefined, undefined)).toEqual({ cursor: undefined, history: [] });
  });

  it("splits the comma-joined history param", () => {
    expect(parseCursorState("c3", "c1,c2")).toEqual({ cursor: "c3", history: ["c1", "c2"] });
  });
});

describe("nextPageHref / prevPageHref", () => {
  it("moves the current cursor into history when advancing", () => {
    const state = { cursor: "c1", history: ["c0"] };
    const href = nextPageHref("/products", "sort=newest", state, "c2");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("cursor")).toBe("c2");
    expect(params.get("cursors")).toBe("c0,c1");
  });

  it("has no cursor params on the very first page's forward link", () => {
    const state = { cursor: undefined, history: [] };
    const href = nextPageHref("/products", "", state, "c1");
    expect(href).toBe("/products?cursor=c1");
  });

  it("pops the last history entry when going back", () => {
    const state = { cursor: "c2", history: ["c0", "c1"] };
    const href = prevPageHref("/products", "sort=newest", state);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("cursor")).toBe("c1");
    expect(params.get("cursors")).toBe("c0");
  });

  it("returns to the bare base path when going back from page two", () => {
    const state = { cursor: "c1", history: [] };
    const href = prevPageHref("/products", "", state);
    expect(href).toBe("/products");
  });
});

describe("viewToggleHref", () => {
  it("omits the view param for grid (the default)", () => {
    const href = viewToggleHref("/products", "sort=newest", { cursor: undefined, history: [] }, "grid");
    expect(href).not.toContain("view=");
  });

  it("sets view=list for the list toggle", () => {
    const href = viewToggleHref("/products", "sort=newest", { cursor: undefined, history: [] }, "list");
    expect(href).toContain("view=list");
  });

  it("preserves the current pagination position", () => {
    const href = viewToggleHref("/products", "", { cursor: "c1", history: ["c0"] }, "grid");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("cursor")).toBe("c1");
    expect(params.get("cursors")).toBe("c0");
  });
});

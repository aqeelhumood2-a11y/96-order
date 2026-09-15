import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import type { Product } from "@/core/catalog/entities";
import { listProducts } from "@/services/catalog/list-products";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Ethiopia Yirgacheffe",
    slug: "ethiopia-yirgacheffe",
    brandId: null,
    primaryCategoryId: "cat-1",
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "active",
    visibility: "visible",
    featured: false,
    sku: "ETH-YIRG-250",
    basePrice: 1500,
    trackInventory: true,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    searchTokens: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "someone",
    updatedBy: "someone",
    ...overrides,
  };
}

describe("listProducts", () => {
  it("denies an actor without products:view", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(listProducts(actor, { limit: 50 }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("passes the request straight through when there is no search query", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:view"]) });

    await listProducts(actor, { limit: 50, status: "active" }, deps);

    expect(deps.products.list).toHaveBeenCalledExactlyOnceWith({ limit: 50, status: "active" });
  });

  it("matches a product by name", async () => {
    const deps = createMockCatalogDeps();
    deps.products.list = vi.fn().mockResolvedValue({
      items: [makeProduct({ id: "p1", searchTokens: ["ethiopia", "yirgacheffe"] }), makeProduct({ id: "p2", searchTokens: ["kenya"] })],
      nextCursor: null,
    });
    const actor = makeSession({ effectivePermissions: new Set(["products:view"]) });

    const page = await listProducts(actor, { limit: 50, search: "ethiopia" }, deps);

    expect(page.items.map((product) => product.id)).toEqual(["p1"]);
    expect(page.nextCursor).toBeNull();
  });

  it("matches a product by brand name, not just product name", async () => {
    const deps = createMockCatalogDeps();
    deps.products.list = vi.fn().mockResolvedValue({
      items: [
        makeProduct({ id: "p1", name: "Adham Blend", searchTokens: ["adham", "blend", "black", "knight"] }),
        makeProduct({ id: "p2", name: "House Blend", searchTokens: ["house", "blend"] }),
      ],
      nextCursor: null,
    });
    const actor = makeSession({ effectivePermissions: new Set(["products:view"]) });

    const page = await listProducts(actor, { limit: 50, search: "black knight" }, deps);

    expect(page.items.map((product) => product.id)).toEqual(["p1"]);
  });

  it("keeps status/category/brand filters active alongside a search query", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:view"]) });

    await listProducts(actor, { limit: 50, search: "coffee", status: "active", categoryId: "cat-1", brandId: "brand-1" }, deps);

    expect(deps.products.list).toHaveBeenCalledExactlyOnceWith({
      limit: 500,
      status: "active",
      categoryId: "cat-1",
      brandId: "brand-1",
    });
  });

  it("caps search results at the requested limit", async () => {
    const deps = createMockCatalogDeps();
    deps.products.list = vi.fn().mockResolvedValue({
      items: [
        makeProduct({ id: "p1", searchTokens: ["coffee"] }),
        makeProduct({ id: "p2", searchTokens: ["coffee"] }),
        makeProduct({ id: "p3", searchTokens: ["coffee"] }),
      ],
      nextCursor: null,
    });
    const actor = makeSession({ effectivePermissions: new Set(["products:view"]) });

    const page = await listProducts(actor, { limit: 2, search: "coffee" }, deps);

    expect(page.items).toHaveLength(2);
  });
});

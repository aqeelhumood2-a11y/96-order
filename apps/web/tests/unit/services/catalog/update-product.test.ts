import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import type { Product } from "@/core/catalog/entities";
import { updateProduct } from "@/services/catalog/update-product";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

function existingProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Ethiopia Yirgacheffe",
    slug: "ethiopia-yirgacheffe",
    brandId: null,
    primaryCategoryId: "cat-1",
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "draft",
    visibility: "hidden",
    featured: false,
    sku: "ETH-YIRG-250",
    basePrice: 1500,
    trackInventory: true,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    version: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "someone",
    updatedBy: "someone",
    ...overrides,
  };
}

describe("updateProduct", () => {
  it("denies an actor without products:edit", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(updateProduct(actor, "prod-1", { version: 3, name: "New name" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the product doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });
    await expect(updateProduct(actor, "ghost", { version: 1, name: "x" }, deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects an unknown category on a category change", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(existingProduct());
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });
    await expect(updateProduct(actor, "prod-1", { version: 3, primaryCategoryId: "ghost-cat" }, deps)).rejects.toThrow(
      ValidationError,
    );
  });

  it("passes expectedVersion through to the repository and propagates a stale-version ConflictError", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(existingProduct());
    deps.products.update = vi.fn().mockRejectedValue(new ConflictError("stale"));
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    await expect(updateProduct(actor, "prod-1", { version: 1, name: "Renamed" }, deps)).rejects.toThrow(ConflictError);
    expect(deps.products.update).toHaveBeenCalledWith("prod-1", expect.objectContaining({ name: "Renamed" }), 1);
  });

  it("re-derives the slug when the name changes and no explicit slug is given", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(existingProduct());
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    await updateProduct(actor, "prod-1", { version: 3, name: "Kenya AA" }, deps);

    expect(deps.products.update).toHaveBeenCalledWith("prod-1", expect.objectContaining({ slug: "kenya-aa" }), 3);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "product_updated" }));
  });

  it("validates variants when a new variants array is provided", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(existingProduct());
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    await expect(
      updateProduct(
        actor,
        "prod-1",
        {
          version: 3,
          hasVariants: true,
          variants: [
            { sku: "A", attributeSelections: { size: "250g" } },
            { sku: "a", attributeSelections: { size: "500g" } },
          ],
        },
        deps,
      ),
    ).rejects.toThrow(ValidationError);
  });
});

import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/core/errors";
import { createProduct } from "@/services/catalog/create-product";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const CATEGORY = {
  id: "cat-1",
  name: "Coffee Beans",
  slug: "coffee-beans",
  parentId: null,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "x",
  updatedBy: "x",
};

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ethiopia Yirgacheffe",
    primaryCategoryId: "cat-1",
    productType: "coffee_beans",
    sku: "ETH-YIRG-250",
    basePrice: 1500,
    ...overrides,
  };
}

describe("createProduct", () => {
  it("denies an actor without products:create", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(createProduct(actor, baseInput(), deps)).rejects.toThrow(ForbiddenError);
  });

  it("rejects an unknown primary category", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });
    await expect(createProduct(actor, baseInput(), deps)).rejects.toThrow(ValidationError);
  });

  it("rejects the primary category also appearing in additionalCategoryIds", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });
    await expect(createProduct(actor, baseInput({ additionalCategoryIds: ["cat-1"] }), deps)).rejects.toThrow(ValidationError);
    expect(deps.products.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown brand", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });
    await expect(createProduct(actor, baseInput({ brandId: "ghost-brand" }), deps)).rejects.toThrow(ValidationError);
  });

  it("rejects hasVariants:true with an empty variants array", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });
    await expect(createProduct(actor, baseInput({ hasVariants: true, variants: [] }), deps)).rejects.toThrow(ValidationError);
  });

  it("rejects a compare-at price that isn't greater than the base price", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });
    await expect(createProduct(actor, baseInput({ compareAtPrice: 1000 }), deps)).rejects.toThrow();
  });

  it("creates the product, seeds an inventory record, and audit-logs product_created", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });

    const product = await createProduct(actor, baseInput(), deps);

    expect(product.slug).toBe("ethiopia-yirgacheffe");
    expect(product.version).toBe(1);
    expect(deps.products.create).toHaveBeenCalledWith(expect.objectContaining({ sku: "ETH-YIRG-250" }));
    expect(deps.inventory.ensureExists).toHaveBeenCalledWith(product.id, null, undefined, actor.uid);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "product_created" }));
  });

  it("derives variant ids and seeds one inventory record per tracked variant, skipping non-tracked ones", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });

    const product = await createProduct(
      actor,
      baseInput({
        hasVariants: true,
        variants: [
          { sku: "ETH-250", attributeSelections: { size: "250g" }, trackInventory: true },
          { sku: "ETH-500", attributeSelections: { size: "500g" }, trackInventory: false },
        ],
      }),
      deps,
    );

    expect(product.variants).toHaveLength(2);
    expect(product.variants.every((variant) => typeof variant.id === "string" && variant.id.length > 0)).toBe(true);
    expect(deps.inventory.ensureExists).toHaveBeenCalledTimes(1);
    expect(deps.inventory.ensureExists).toHaveBeenCalledWith(product.id, product.variants[0]!.id, undefined, actor.uid);
  });

  it("rejects duplicate variant SKUs within the same request before ever calling the repository", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:create"]) });

    await expect(
      createProduct(
        actor,
        baseInput({
          hasVariants: true,
          variants: [
            { sku: "DUP", attributeSelections: { size: "250g" } },
            { sku: "dup", attributeSelections: { size: "500g" } },
          ],
        }),
        deps,
      ),
    ).rejects.toThrow(ValidationError);
    expect(deps.products.create).not.toHaveBeenCalled();
  });

  it("is satisfied by products:manage too, via the namespace wildcard", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["products:manage"]) });
    await expect(createProduct(actor, baseInput(), deps)).resolves.toBeDefined();
  });
});

import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { adjustInventory } from "@/services/catalog/adjust-inventory";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const SIMPLE_PRODUCT = {
  id: "prod-1",
  allowBackorder: false,
  variants: [],
};

const VARIANT_PRODUCT = {
  id: "prod-2",
  allowBackorder: false,
  variants: [{ id: "var-1", allowBackorder: true }],
};

describe("adjustInventory", () => {
  it("denies an actor without inventory:adjust", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(
      adjustInventory(actor, { productId: "prod-1", variantId: null, reason: "stock_in", quantityDelta: 5 }, deps),
    ).rejects.toThrow(ForbiddenError);
  });

  it("404s when the product doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });
    await expect(
      adjustInventory(actor, { productId: "ghost", variantId: null, reason: "stock_in", quantityDelta: 5 }, deps),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects an unknown variant id on the product", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(SIMPLE_PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });
    await expect(
      adjustInventory(actor, { productId: "prod-1", variantId: "ghost-variant", reason: "stock_in", quantityDelta: 5 }, deps),
    ).rejects.toThrow(ValidationError);
  });

  it("uses the product-level allowBackorder flag for a simple (no-variant) product", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(SIMPLE_PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });

    await adjustInventory(actor, { productId: "prod-1", variantId: null, reason: "stock_in", quantityDelta: 5 }, deps);

    expect(deps.inventory.adjust).toHaveBeenCalledWith(expect.objectContaining({ allowBackorder: false }));
  });

  it("uses the variant's own allowBackorder flag, not the parent product's, when a variant is targeted", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(VARIANT_PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });

    await adjustInventory(actor, { productId: "prod-2", variantId: "var-1", reason: "stock_out", quantityDelta: -3 }, deps);

    expect(deps.inventory.adjust).toHaveBeenCalledWith(expect.objectContaining({ allowBackorder: true }));
  });

  it("propagates a ConflictError from the repository when the adjustment would take stock negative", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(SIMPLE_PRODUCT);
    deps.inventory.adjust = vi.fn().mockRejectedValue(new ConflictError("would go negative"));
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });

    await expect(
      adjustInventory(actor, { productId: "prod-1", variantId: null, reason: "stock_out", quantityDelta: -100 }, deps),
    ).rejects.toThrow(ConflictError);
  });

  it("audit-logs inventory_adjusted with the resulting quantities", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(SIMPLE_PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["inventory:adjust"]) });

    await adjustInventory(actor, { productId: "prod-1", variantId: null, reason: "correction", quantityDelta: 10 }, deps);

    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "inventory_adjusted", metadata: expect.objectContaining({ productId: "prod-1", quantityDelta: 10 }) }),
    );
  });
});

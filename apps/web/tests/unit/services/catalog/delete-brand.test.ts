import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { deleteBrand } from "@/services/catalog/delete-brand";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const BRAND = { id: "brand-1", slug: "acme" };

describe("deleteBrand", () => {
  it("denies an actor without brands:delete", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(deleteBrand(actor, "brand-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the brand doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["brands:delete"]) });
    await expect(deleteBrand(actor, "ghost", deps)).rejects.toThrow(NotFoundError);
  });

  it("refuses to delete a brand assigned to a product", async () => {
    const deps = createMockCatalogDeps();
    deps.brands.findById = vi.fn().mockResolvedValue(BRAND);
    deps.products.countByBrand = vi.fn().mockResolvedValue(2);
    const actor = makeSession({ effectivePermissions: new Set(["brands:delete"]) });

    await expect(deleteBrand(actor, "brand-1", deps)).rejects.toThrow(ForbiddenError);
    expect(deps.brands.delete).not.toHaveBeenCalled();
  });

  it("deletes an unused brand and audit-logs brand_deleted", async () => {
    const deps = createMockCatalogDeps();
    deps.brands.findById = vi.fn().mockResolvedValue(BRAND);
    const actor = makeSession({ effectivePermissions: new Set(["brands:delete"]) });

    await deleteBrand(actor, "brand-1", deps);

    expect(deps.brands.delete).toHaveBeenCalledWith("brand-1");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "brand_deleted" }));
  });
});

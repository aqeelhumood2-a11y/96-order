import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { archiveProduct } from "@/services/catalog/archive-product";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

describe("archiveProduct", () => {
  it("denies an actor without products:delete", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(archiveProduct(actor, "prod-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the product doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:delete"]) });
    await expect(archiveProduct(actor, "ghost", deps)).rejects.toThrow(NotFoundError);
  });

  it("archives the product (never hard-deletes) and audit-logs product_archived", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue({ id: "prod-1", slug: "ethiopia" });
    const actor = makeSession({ effectivePermissions: new Set(["products:delete"]) });

    await archiveProduct(actor, "prod-1", deps);

    expect(deps.products.archive).toHaveBeenCalledWith("prod-1", actor.uid);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "product_archived" }));
  });
});

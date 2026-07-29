import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { deleteCategory } from "@/services/catalog/delete-category";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const CATEGORY = { id: "cat-1", slug: "coffee-beans" };

describe("deleteCategory", () => {
  it("denies an actor without categories:delete", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(deleteCategory(actor, "cat-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the category doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["categories:delete"]) });
    await expect(deleteCategory(actor, "ghost", deps)).rejects.toThrow(NotFoundError);
  });

  it("refuses to delete a category assigned to a product", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    deps.products.countByCategory = vi.fn().mockResolvedValue(1);
    const actor = makeSession({ effectivePermissions: new Set(["categories:delete"]) });

    await expect(deleteCategory(actor, "cat-1", deps)).rejects.toThrow(ForbiddenError);
    expect(deps.categories.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete a category that has subcategories", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    deps.categories.list = vi.fn().mockResolvedValue({ items: [{ id: "child" }], nextCursor: null });
    const actor = makeSession({ effectivePermissions: new Set(["categories:delete"]) });

    await expect(deleteCategory(actor, "cat-1", deps)).rejects.toThrow(ForbiddenError);
    expect(deps.categories.delete).not.toHaveBeenCalled();
  });

  it("deletes an unused, childless category and audit-logs category_deleted", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(CATEGORY);
    const actor = makeSession({ effectivePermissions: new Set(["categories:delete"]) });

    await deleteCategory(actor, "cat-1", deps);

    expect(deps.categories.delete).toHaveBeenCalledWith("cat-1");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "category_deleted" }));
  });
});

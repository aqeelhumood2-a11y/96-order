import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { updateCategory } from "@/services/catalog/update-category";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const EXISTING = {
  id: "cat-child",
  name: "Espresso",
  slug: "espresso",
  parentId: "cat-parent",
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "x",
  updatedBy: "x",
};

describe("updateCategory", () => {
  it("denies an actor without categories:edit", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(updateCategory(actor, "cat-child", { name: "x" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the category doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["categories:edit"]) });
    await expect(updateCategory(actor, "ghost", { name: "x" }, deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects reparenting to a category that would create a cycle", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockImplementation(async (id: string) => {
      if (id === "cat-child") return EXISTING;
      // "cat-descendant"'s parent is "cat-child" — reparenting cat-child
      // under cat-descendant would close the loop.
      if (id === "cat-descendant") return { id: "cat-descendant", parentId: "cat-child" };
      return null;
    });
    const actor = makeSession({ effectivePermissions: new Set(["categories:edit"]) });

    await expect(updateCategory(actor, "cat-child", { parentId: "cat-descendant" }, deps)).rejects.toThrow(ValidationError);
    expect(deps.categories.update).not.toHaveBeenCalled();
  });

  it("allows reparenting to an unrelated, valid category", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockImplementation(async (id: string) => {
      if (id === "cat-child") return EXISTING;
      if (id === "cat-other") return { id: "cat-other", parentId: null };
      return null;
    });
    const actor = makeSession({ effectivePermissions: new Set(["categories:edit"]) });

    await updateCategory(actor, "cat-child", { parentId: "cat-other" }, deps);

    expect(deps.categories.update).toHaveBeenCalledWith("cat-child", expect.objectContaining({ parentId: "cat-other" }));
  });

  it("re-derives the slug when the name changes", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue(EXISTING);
    const actor = makeSession({ effectivePermissions: new Set(["categories:edit"]) });

    await updateCategory(actor, "cat-child", { name: "Cold Brew" }, deps);

    expect(deps.categories.update).toHaveBeenCalledWith("cat-child", expect.objectContaining({ slug: "cold-brew" }));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "category_updated" }));
  });
});

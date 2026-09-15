import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, ValidationError } from "@/core/errors";
import { createCategory } from "@/services/catalog/create-category";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

describe("createCategory", () => {
  it("denies an actor without categories:create", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(createCategory(actor, { name: "Coffee Beans" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("rejects an unknown parent category", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["categories:create"]) });
    await expect(createCategory(actor, { name: "Espresso", parentId: "ghost" }, deps)).rejects.toThrow(ValidationError);
  });

  it("derives a slug from the name when none is given", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["categories:create"]) });

    const category = await createCategory(actor, { name: "Coffee Beans" }, deps);

    expect(category.slug).toBe("coffee-beans");
    expect(deps.categories.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "coffee-beans" }));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "category_created" }));
  });

  it("uses an explicit slug when provided", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["categories:create"]) });

    const category = await createCategory(actor, { name: "Coffee Beans", slug: "custom-slug" }, deps);

    expect(category.slug).toBe("custom-slug");
  });

  it("retries with a suffixed slug when the derived slug is already taken", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.create = vi
      .fn()
      .mockRejectedValueOnce(new ConflictError())
      .mockResolvedValueOnce(undefined);
    const actor = makeSession({ effectivePermissions: new Set(["categories:create"]) });

    // Two differently-named Arabic categories can both slugify down to the
    // same bare digits (e.g. a shared weight like "250 g") once every
    // non-Latin character is stripped — see `services/catalog/unique-slug.ts`.
    const category = await createCategory(actor, { name: "قهوة 250" }, deps);

    expect(category.slug).toMatch(/^250-[0-9a-f]{6}$/);
    expect(deps.categories.create).toHaveBeenCalledTimes(2);
  });

  it("allows a valid parent", async () => {
    const deps = createMockCatalogDeps();
    deps.categories.findById = vi.fn().mockResolvedValue({ id: "parent-1" });
    const actor = makeSession({ effectivePermissions: new Set(["categories:create"]) });

    await expect(createCategory(actor, { name: "Espresso", parentId: "parent-1" }, deps)).resolves.toBeDefined();
  });
});

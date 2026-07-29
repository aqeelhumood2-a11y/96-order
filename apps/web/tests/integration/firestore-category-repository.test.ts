import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Category } from "@/core/catalog/entities";
import { ConflictError } from "@/core/errors";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";

const repo = new FirestoreCategoryRepository();

function makeCategory(overrides: Partial<Category> = {}): Category {
  const id = randomUUID();
  const now = new Date();
  return {
    id,
    name: `Category ${id}`,
    slug: `category-${id}`,
    parentId: null,
    sortOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    updatedBy: "test-runner",
    ...overrides,
  };
}

describe("FirestoreCategoryRepository (emulator)", () => {
  it("creates and finds a category by id and by slug", async () => {
    const category = makeCategory();
    await repo.create(category);

    expect((await repo.findById(category.id))?.name).toBe(category.name);
    expect((await repo.findBySlug(category.slug))?.id).toBe(category.id);
  });

  it("rejects a duplicate slug across two different categories", async () => {
    const slug = `dup-cat-${randomUUID()}`;
    await repo.create(makeCategory({ slug }));
    await expect(repo.create(makeCategory({ slug }))).rejects.toThrow(ConflictError);
  });

  it("frees the slug for reuse once the owning category is deleted", async () => {
    const slug = `freed-cat-${randomUUID()}`;
    const category = makeCategory({ slug });
    await repo.create(category);

    await repo.delete(category.id);

    await expect(repo.create(makeCategory({ slug }))).resolves.toBeUndefined();
  });

  it("lists direct children of a parent", async () => {
    const parent = makeCategory();
    await repo.create(parent);
    const child = makeCategory({ parentId: parent.id });
    await repo.create(child);

    const page = await repo.list({ limit: 10, parentId: parent.id });
    expect(page.items.map((item) => item.id)).toContain(child.id);
  });
});

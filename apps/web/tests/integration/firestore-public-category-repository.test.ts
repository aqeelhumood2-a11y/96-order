import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Category } from "@/core/catalog/entities";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestorePublicCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-public-category-repository";

const adminRepo = new FirestoreCategoryRepository();
const publicRepo = new FirestorePublicCategoryRepository();

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

describe("FirestorePublicCategoryRepository (emulator)", () => {
  it("returns an active category by slug and by id", async () => {
    const category = makeCategory();
    await adminRepo.create(category);

    expect((await publicRepo.findBySlug(category.slug))?.id).toBe(category.id);
    expect((await publicRepo.findById(category.id))?.name).toBe(category.name);
  });

  it("never returns an inactive category, by slug, by id, or in listActive", async () => {
    const category = makeCategory({ isActive: false });
    await adminRepo.create(category);

    expect(await publicRepo.findBySlug(category.slug)).toBeNull();
    expect(await publicRepo.findById(category.id)).toBeNull();

    const active = await publicRepo.listActive(200);
    expect(active.some((item) => item.id === category.id)).toBe(false);
  });

  it("returns null identically for a never-existed slug and an inactive one", async () => {
    const inactive = makeCategory({ isActive: false });
    await adminRepo.create(inactive);

    expect(await publicRepo.findBySlug(inactive.slug)).toBeNull();
    expect(await publicRepo.findBySlug(`never-existed-${randomUUID()}`)).toBeNull();
  });

  it("omits the parent ref when the parent category is inactive", async () => {
    const parent = makeCategory({ isActive: false });
    await adminRepo.create(parent);
    const child = makeCategory({ parentId: parent.id });
    await adminRepo.create(child);

    const found = await publicRepo.findBySlug(child.slug);
    expect(found?.parent).toBeNull();
  });

  it("includes the parent ref when the parent category is active", async () => {
    const parent = makeCategory();
    await adminRepo.create(parent);
    const child = makeCategory({ parentId: parent.id });
    await adminRepo.create(child);

    const found = await publicRepo.findBySlug(child.slug);
    expect(found?.parent).toEqual({ name: parent.name, slug: parent.slug });
  });
});

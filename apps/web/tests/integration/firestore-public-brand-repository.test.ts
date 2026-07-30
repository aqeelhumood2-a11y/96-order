import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Brand } from "@/core/catalog/entities";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";
import { FirestorePublicBrandRepository } from "@/infrastructure/firebase/repositories/firestore-public-brand-repository";

const adminRepo = new FirestoreBrandRepository();
const publicRepo = new FirestorePublicBrandRepository();

function makeBrand(overrides: Partial<Brand> = {}): Brand {
  const id = randomUUID();
  const now = new Date();
  return {
    id,
    name: `Brand ${id}`,
    slug: `brand-${id}`,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    updatedBy: "test-runner",
    ...overrides,
  };
}

describe("FirestorePublicBrandRepository (emulator)", () => {
  it("returns an active brand by slug and by id", async () => {
    const brand = makeBrand();
    await adminRepo.create(brand);

    expect((await publicRepo.findBySlug(brand.slug))?.id).toBe(brand.id);
    expect((await publicRepo.findById(brand.id))?.name).toBe(brand.name);
  });

  it("never returns an inactive brand, by slug, by id, or in listActive", async () => {
    const brand = makeBrand({ isActive: false });
    await adminRepo.create(brand);

    expect(await publicRepo.findBySlug(brand.slug)).toBeNull();
    expect(await publicRepo.findById(brand.id)).toBeNull();

    const active = await publicRepo.listActive(200);
    expect(active.some((item) => item.id === brand.id)).toBe(false);
  });

  it("returns null identically for a never-existed slug and an inactive one", async () => {
    const inactive = makeBrand({ isActive: false });
    await adminRepo.create(inactive);

    expect(await publicRepo.findBySlug(inactive.slug)).toBeNull();
    expect(await publicRepo.findBySlug(`never-existed-${randomUUID()}`)).toBeNull();
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Brand } from "@/core/catalog/entities";
import { ConflictError } from "@/core/errors";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";

const repo = new FirestoreBrandRepository();

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

describe("FirestoreBrandRepository (emulator)", () => {
  it("creates and finds a brand by id and by slug", async () => {
    const brand = makeBrand();
    await repo.create(brand);

    expect((await repo.findById(brand.id))?.name).toBe(brand.name);
    expect((await repo.findBySlug(brand.slug))?.id).toBe(brand.id);
  });

  it("rejects a duplicate slug across two different brands", async () => {
    const slug = `dup-brand-${randomUUID()}`;
    await repo.create(makeBrand({ slug }));
    await expect(repo.create(makeBrand({ slug }))).rejects.toThrow(ConflictError);
  });

  it("frees the slug for reuse once the owning brand is deleted", async () => {
    const slug = `freed-brand-${randomUUID()}`;
    const brand = makeBrand({ slug });
    await repo.create(brand);

    await repo.delete(brand.id);

    await expect(repo.create(makeBrand({ slug }))).resolves.toBeUndefined();
  });
});

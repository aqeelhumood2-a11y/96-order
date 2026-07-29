import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Product } from "@/core/catalog/entities";
import { ConflictError, NotFoundError } from "@/core/errors";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";

const repo = new FirestoreProductRepository();

function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = randomUUID();
  const now = new Date();
  return {
    id,
    name: `Test Product ${id}`,
    slug: `test-product-${id}`,
    brandId: null,
    primaryCategoryId: "cat-1",
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "draft",
    visibility: "hidden",
    featured: false,
    sku: `SKU-${id}`,
    basePrice: 1000,
    trackInventory: true,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    updatedBy: "test-runner",
    ...overrides,
  };
}

describe("FirestoreProductRepository (emulator)", () => {
  it("creates and finds a product by id", async () => {
    const product = makeProduct();
    await repo.create(product);

    const found = await repo.findById(product.id);
    expect(found?.name).toBe(product.name);
    expect(found?.sku).toBe(product.sku);
    expect(found?.version).toBe(1);
  });

  it("rejects a duplicate slug across two different products", async () => {
    const slug = `dup-slug-${randomUUID()}`;
    await repo.create(makeProduct({ slug }));
    await expect(repo.create(makeProduct({ slug }))).rejects.toThrow(ConflictError);
  });

  it("rejects a duplicate SKU across two different products", async () => {
    const sku = `DUP-SKU-${randomUUID()}`;
    await repo.create(makeProduct({ sku }));
    await expect(repo.create(makeProduct({ sku }))).rejects.toThrow(ConflictError);
  });

  it("rejects a duplicate barcode across two different products", async () => {
    const barcode = `DUP-BARCODE-${randomUUID()}`;
    await repo.create(makeProduct({ barcode }));
    await expect(repo.create(makeProduct({ barcode }))).rejects.toThrow(ConflictError);
  });

  it("rejects a variant SKU that collides with another product's top-level SKU", async () => {
    const sharedSku = `SHARED-${randomUUID()}`;
    await repo.create(makeProduct({ sku: sharedSku }));

    await expect(
      repo.create(
        makeProduct({
          hasVariants: true,
          variants: [
            {
              id: randomUUID(),
              sku: sharedSku,
              attributeSelections: { size: "500g" },
              status: "active",
              trackInventory: true,
              allowBackorder: false,
            },
          ],
        }),
      ),
    ).rejects.toThrow(ConflictError);
  });

  it("allows the same slug/sku to be reused by the same product on update (no false self-conflict)", async () => {
    const product = makeProduct();
    await repo.create(product);

    await expect(repo.update(product.id, { name: "Renamed", slug: product.slug, sku: product.sku }, 1)).resolves.toBeUndefined();
  });

  it("enforces optimistic concurrency via expectedVersion, and bumps version on success", async () => {
    const product = makeProduct();
    await repo.create(product);

    await expect(repo.update(product.id, { name: "Stale writer" }, 999)).rejects.toThrow(ConflictError);

    await repo.update(product.id, { name: "Correct writer" }, 1);
    const updated = await repo.findById(product.id);
    expect(updated?.name).toBe("Correct writer");
    expect(updated?.version).toBe(2);
  });

  it("404s updating a product that doesn't exist", async () => {
    await expect(repo.update(randomUUID(), { name: "x" }, 1)).rejects.toThrow(NotFoundError);
  });

  it("frees the old SKU for reuse once a product's SKU is changed", async () => {
    const oldSku = `OLD-${randomUUID()}`;
    const newSku = `NEW-${randomUUID()}`;
    const product = makeProduct({ sku: oldSku });
    await repo.create(product);

    await repo.update(product.id, { sku: newSku }, 1);

    // The old SKU should now be free for a brand-new product to claim.
    await expect(repo.create(makeProduct({ sku: oldSku }))).resolves.toBeUndefined();
  });

  it("archive() sets status to archived without hard-deleting the document", async () => {
    const product = makeProduct();
    await repo.create(product);

    await repo.archive(product.id, "actor-uid");

    const archived = await repo.findById(product.id);
    expect(archived).not.toBeNull();
    expect(archived?.status).toBe("archived");
    expect(archived?.updatedBy).toBe("actor-uid");
  });

  it("counts products by category and by brand", async () => {
    const categoryId = randomUUID();
    const brandId = randomUUID();
    await repo.create(makeProduct({ primaryCategoryId: categoryId, brandId }));
    await repo.create(makeProduct({ primaryCategoryId: "other-cat", additionalCategoryIds: [categoryId], brandId: null }));

    expect(await repo.countByCategory(categoryId)).toBe(2);
    expect(await repo.countByBrand(brandId)).toBe(1);
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Brand, Category, Product, ProductStatus, ProductVisibility } from "@/core/catalog/entities";
import { buildSearchTokens } from "@/core/catalog/rules";
import type { ProductImageStoragePort } from "@/core/interfaces/product-image-storage-port";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";
import { FirestorePublicBrandRepository } from "@/infrastructure/firebase/repositories/firestore-public-brand-repository";
import { FirestorePublicCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-public-category-repository";
import { FirestorePublicInventoryAvailability } from "@/infrastructure/firebase/repositories/firestore-public-inventory-availability";
import { FirestorePublicProductRepository } from "@/infrastructure/firebase/repositories/firestore-public-product-repository";

const adminProducts = new FirestoreProductRepository();
const adminCategories = new FirestoreCategoryRepository();
const adminBrands = new FirestoreBrandRepository();

/** Avoids depending on the Storage emulator for image bytes — this suite is about visibility/filtering, not image delivery (see product-image-storage.test.ts for that). */
const stubImages: ProductImageStoragePort = {
  upload: () => {
    throw new Error("not used in this suite");
  },
  delete: () => Promise.resolve(),
  getDownloadUrl: (storagePath: string) => Promise.resolve(`https://example.com/${storagePath}`),
};

const publicCategories = new FirestorePublicCategoryRepository();
const publicBrands = new FirestorePublicBrandRepository();
const publicAvailability = new FirestorePublicInventoryAvailability();
const publicProducts = new FirestorePublicProductRepository(publicCategories, publicBrands, publicAvailability, stubImages);

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

function makeProduct(categoryId: string, overrides: Partial<Product> = {}): Product {
  const id = randomUUID();
  const now = new Date();
  const name = overrides.name ?? `Test Product ${id}`;
  const sku = overrides.sku ?? `SKU-${id}`;
  return {
    id,
    name,
    slug: `test-product-${id}`,
    brandId: null,
    primaryCategoryId: categoryId,
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "active",
    visibility: "visible",
    featured: false,
    sku,
    basePrice: 1500,
    trackInventory: false,
    allowBackorder: false,
    tags: [],
    hasVariants: false,
    variants: [],
    images: [],
    searchTokens: buildSearchTokens({ name, sku, tags: [], productType: "coffee_beans" }),
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    updatedBy: "test-runner",
    ...overrides,
  };
}

async function seedCategory(overrides: Partial<Category> = {}): Promise<Category> {
  const category = makeCategory(overrides);
  await adminCategories.create(category);
  return category;
}

describe("FirestorePublicProductRepository (emulator)", () => {
  it("list() never returns a draft, archived, or hidden product, only active+visible", async () => {
    const category = await seedCategory();
    const combos: [ProductStatus, ProductVisibility][] = [
      ["active", "visible"],
      ["draft", "hidden"],
      ["active", "hidden"],
      ["archived", "visible"],
      ["archived", "hidden"],
    ];

    const created = await Promise.all(
      combos.map(([status, visibility]) => {
        const product = makeProduct(category.id, { status, visibility });
        return adminProducts.create(product).then(() => product);
      }),
    );

    const page = await publicProducts.list({ categoryId: category.id, sort: "newest", limit: 50 });
    const returnedIds = page.items.map((item) => item.id);

    expect(returnedIds).toEqual([created[0]!.id]);
    for (const excluded of created.slice(1)) {
      expect(returnedIds).not.toContain(excluded.id);
    }
  });

  it("findBySlug returns null identically for draft, archived, hidden, and a never-existed slug", async () => {
    const category = await seedCategory();
    const draft = makeProduct(category.id, { status: "draft", visibility: "hidden" });
    const archived = makeProduct(category.id, { status: "archived", visibility: "visible" });
    const hidden = makeProduct(category.id, { status: "active", visibility: "hidden" });
    await Promise.all([adminProducts.create(draft), adminProducts.create(archived), adminProducts.create(hidden)]);

    expect(await publicProducts.findBySlug(draft.slug)).toBeNull();
    expect(await publicProducts.findBySlug(archived.slug)).toBeNull();
    expect(await publicProducts.findBySlug(hidden.slug)).toBeNull();
    expect(await publicProducts.findBySlug(`never-existed-${randomUUID()}`)).toBeNull();
  });

  it("findBySlug returns the full detail shape for an active+visible product, including resolved brand/category refs", async () => {
    const category = await seedCategory();
    const brand = makeBrand();
    await adminBrands.create(brand);
    const product = makeProduct(category.id, { brandId: brand.id, basePrice: 2400 });
    await adminProducts.create(product);

    const found = await publicProducts.findBySlug(product.slug);
    expect(found).not.toBeNull();
    expect(found?.name).toBe(product.name);
    expect(found?.basePrice).toBe(2400);
    expect(found?.brand).toEqual({ name: brand.name, slug: brand.slug });
    expect(found?.primaryCategory).toEqual({ name: category.name, slug: category.slug });
    // Never exposes cost price, internal notes, or a barcode by default.
    expect(found).not.toHaveProperty("costPrice");
    expect(found?.barcode).toBeUndefined();
  });

  it("listFeatured only returns active+visible+featured products", async () => {
    const category = await seedCategory();
    const featuredVisible = makeProduct(category.id, { featured: true });
    const featuredHidden = makeProduct(category.id, { featured: true, visibility: "hidden" });
    const notFeatured = makeProduct(category.id, { featured: false });
    await Promise.all([adminProducts.create(featuredVisible), adminProducts.create(featuredHidden), adminProducts.create(notFeatured)]);

    const items = await publicProducts.listFeatured(50);
    const ids = items.map((item) => item.id);
    expect(ids).toContain(featuredVisible.id);
    expect(ids).not.toContain(featuredHidden.id);
    expect(ids).not.toContain(notFeatured.id);
  });

  it("listByCategoryId excludes the given product id and any non-active/visible product", async () => {
    const category = await seedCategory();
    const current = makeProduct(category.id);
    const related = makeProduct(category.id);
    const hiddenSibling = makeProduct(category.id, { visibility: "hidden" });
    await Promise.all([adminProducts.create(current), adminProducts.create(related), adminProducts.create(hiddenSibling)]);

    const items = await publicProducts.listByCategoryId(category.id, current.id, 50);
    const ids = items.map((item) => item.id);
    expect(ids).toContain(related.id);
    expect(ids).not.toContain(current.id);
    expect(ids).not.toContain(hiddenSibling.id);
  });

  it("searchByToken only matches active+visible products", async () => {
    const category = await seedCategory();
    const uniqueWord = `zephyr${randomUUID().slice(0, 8)}`;
    const visible = makeProduct(category.id, {
      name: `${uniqueWord} Blend`,
      searchTokens: buildSearchTokens({ name: `${uniqueWord} Blend`, sku: `SKU-${randomUUID()}`, tags: [], productType: "coffee_beans" }),
    });
    const hidden = makeProduct(category.id, {
      name: `${uniqueWord} Reserve`,
      visibility: "hidden",
      searchTokens: buildSearchTokens({ name: `${uniqueWord} Reserve`, sku: `SKU-${randomUUID()}`, tags: [], productType: "coffee_beans" }),
    });
    await Promise.all([adminProducts.create(visible), adminProducts.create(hidden)]);

    const page = await publicProducts.searchByToken(uniqueWord.toLowerCase(), undefined, 50);
    const ids = page.items.map((item) => item.id);
    expect(ids).toContain(visible.id);
    expect(ids).not.toContain(hidden.id);
  });

  it("list() pushes down at most the primary filter (category) and paginates via nextCursor", async () => {
    const category = await seedCategory();
    const products = await Promise.all(
      Array.from({ length: 3 }, () => {
        const product = makeProduct(category.id);
        return adminProducts.create(product).then(() => product);
      }),
    );

    const firstPage = await publicProducts.list({ categoryId: category.id, sort: "newest", limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await publicProducts.list({ categoryId: category.id, sort: "newest", limit: 2, cursor: firstPage.nextCursor! });
    const allIds = [...firstPage.items, ...secondPage.items].map((item) => item.id);
    for (const product of products) {
      expect(allIds).toContain(product.id);
    }
  });
});

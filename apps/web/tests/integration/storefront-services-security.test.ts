import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Category, Product } from "@/core/catalog/entities";
import { buildSearchTokens } from "@/core/catalog/rules";
import { listProductsQuerySchema, searchQuerySchema } from "@/core/storefront/schemas";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";
import { defaultStorefrontDeps } from "@/services/storefront/dependencies";
import { getProductBySlug } from "@/services/storefront/get-product";
import { listProducts } from "@/services/storefront/list-products";
import { searchProducts } from "@/services/storefront/search-products";

/**
 * `unstable_cache` (used by the default, cached entry points in
 * `services/storefront/*`) throws outside a real Next.js server request —
 * confirmed empirically, since Next's data cache requires request-scoped
 * machinery a plain Vitest/Node process doesn't provide. Spreading
 * `defaultStorefrontDeps` into a new object defeats each service's
 * `deps === defaultStorefrontDeps` identity check, routing to the plain
 * uncached function while still exercising the real Firestore adapters —
 * this is how this suite tests the service layer's own composition
 * (category/brand resolution, in-memory refinement) against the emulator
 * without needing a running Next server. `withStorefrontCache`'s tag/
 * revalidate wiring itself is covered by a mocked unit test instead — see
 * tests/unit/storefront/cache.test.ts.
 */
const uncachedDeps = { ...defaultStorefrontDeps };

const adminProducts = new FirestoreProductRepository();
const adminCategories = new FirestoreCategoryRepository();

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

describe("storefront services (emulator, uncached path)", () => {
  it("getProductBySlug returns null for a draft product and the real DTO for an active+visible one", async () => {
    const category = makeCategory();
    await adminCategories.create(category);

    const draft = makeProduct(category.id, { status: "draft", visibility: "hidden" });
    const published = makeProduct(category.id);
    await Promise.all([adminProducts.create(draft), adminProducts.create(published)]);

    expect(await getProductBySlug(draft.slug, uncachedDeps)).toBeNull();
    expect((await getProductBySlug(published.slug, uncachedDeps))?.name).toBe(published.name);
  });

  it("listProducts filters out a hidden category slug to an empty result, not an error", async () => {
    const category = makeCategory({ isActive: false });
    await adminCategories.create(category);

    const query = listProductsQuerySchema.parse({ category: category.slug });
    const page = await listProducts(query, uncachedDeps);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("listProducts applies the category filter end-to-end and excludes non-active/visible products", async () => {
    const category = makeCategory();
    await adminCategories.create(category);
    const published = makeProduct(category.id);
    const hidden = makeProduct(category.id, { visibility: "hidden" });
    await Promise.all([adminProducts.create(published), adminProducts.create(hidden)]);

    const query = listProductsQuerySchema.parse({ category: category.slug });
    const page = await listProducts(query, uncachedDeps);
    const ids = page.items.map((item) => item.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(hidden.id);
  });

  it("searchProducts never surfaces a draft or hidden product even when its name matches the query", async () => {
    const category = makeCategory();
    await adminCategories.create(category);
    const uniqueWord = `nimbus${randomUUID().slice(0, 8)}`;

    const published = makeProduct(category.id, {
      name: `${uniqueWord} Coffee`,
      searchTokens: buildSearchTokens({ name: `${uniqueWord} Coffee`, sku: `SKU-${randomUUID()}`, tags: [], productType: "coffee_beans" }),
    });
    const draft = makeProduct(category.id, {
      name: `${uniqueWord} Reserve`,
      status: "draft",
      visibility: "hidden",
      searchTokens: buildSearchTokens({ name: `${uniqueWord} Reserve`, sku: `SKU-${randomUUID()}`, tags: [], productType: "coffee_beans" }),
    });
    await Promise.all([adminProducts.create(published), adminProducts.create(draft)]);

    const query = searchQuerySchema.parse({ q: uniqueWord });
    const page = await searchProducts(query, uncachedDeps);
    const ids = page.items.map((item) => item.id);
    expect(ids).toContain(published.id);
    expect(ids).not.toContain(draft.id);
  });
});

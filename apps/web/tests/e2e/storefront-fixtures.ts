import { randomUUID } from "node:crypto";
import type { Brand, Category, Product } from "@/core/catalog/entities";
import { buildSearchTokens } from "@/core/catalog/rules";
import { FirestoreBrandRepository } from "@/infrastructure/firebase/repositories/firestore-brand-repository";
import { FirestoreCategoryRepository } from "@/infrastructure/firebase/repositories/firestore-category-repository";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";

const categories = new FirestoreCategoryRepository();
const brands = new FirestoreBrandRepository();
const products = new FirestoreProductRepository();

/**
 * Seeds catalog fixtures directly through the real admin repositories
 * (Node-side, same pattern as global-setup.ts's Auth/Firestore seeding),
 * not through the admin UI. Two reasons: the admin variant editor's inputs
 * aren't associated with their `<Label>`s via `htmlFor`/`id` (fragile to
 * drive through Playwright), and every UI-driven admin action requires a
 * login — auth.spec.ts and catalog.spec.ts already spend most of the
 * shared per-IP login rate limit (`config/auth.ts`'s `sessionCreateByIp`,
 * 10 per 15 minutes — a real production safety limit, never weakened for
 * tests), so adding more logins here risks tipping it over.
 *
 * The tradeoff: a direct write bypasses `revalidateStorefrontTag`, so a
 * fixed-key cached read (e.g. `listFeaturedProducts`, warmed empty by
 * Playwright's own webServer-readiness probe hitting `/` before this file
 * ever runs) can stay stale for this whole run. storefront.spec.ts's
 * homepage test is deliberately structural only (no seeded-product
 * assertion) for exactly this reason; its featured-product coverage runs
 * against `/products?featured=true` instead, a query-string cache key the
 * readiness probe never touched and which reads Firestore fresh.
 */
export interface StorefrontFixtures {
  category: Category;
  inactiveCategory: Category;
  brand: Brand;
  published: Product;
  draft: Product;
  hiddenVisibility: Product;
  withVariants: Product;
  searchWord: string;
}

export async function seedStorefrontFixtures(): Promise<StorefrontFixtures> {
  const suffix = randomUUID().slice(0, 8);
  const now = new Date();

  const category: Category = {
    id: randomUUID(),
    name: `Single Origin ${suffix}`,
    slug: `single-origin-${suffix}`,
    parentId: null,
    sortOrder: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-storefront-setup",
    updatedBy: "e2e-storefront-setup",
  };
  await categories.create(category);

  const inactiveCategory: Category = {
    ...category,
    id: randomUUID(),
    name: `Retired Category ${suffix}`,
    slug: `retired-category-${suffix}`,
    isActive: false,
  };
  await categories.create(inactiveCategory);

  const brand: Brand = {
    id: randomUUID(),
    name: `Storefront Roasters ${suffix}`,
    slug: `storefront-roasters-${suffix}`,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-storefront-setup",
    updatedBy: "e2e-storefront-setup",
  };
  await brands.create(brand);

  const searchWord = `zephyrella${suffix}`;

  function baseProduct(overrides: Partial<Product>): Product {
    const id = randomUUID();
    const name = overrides.name ?? `Product ${id}`;
    const sku = overrides.sku ?? `SKU-${id}`;
    const tags = overrides.tags ?? [];
    return {
      id,
      name,
      slug: `product-${id}`,
      brandId: brand.id,
      primaryCategoryId: category.id,
      additionalCategoryIds: [],
      productType: "coffee_beans",
      status: "active",
      visibility: "visible",
      featured: false,
      sku,
      basePrice: 1899,
      trackInventory: false,
      allowBackorder: false,
      tags,
      hasVariants: false,
      variants: [],
      images: [],
      shortDescription: "A bright, floral single-origin coffee.",
      searchTokens: buildSearchTokens({ name, sku, tags, productType: "coffee_beans", brandName: brand.name, categoryName: category.name }),
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: "e2e-storefront-setup",
      updatedBy: "e2e-storefront-setup",
      ...overrides,
    };
  }

  const published = baseProduct({
    name: `${searchWord} Ethiopia`,
    sku: `ETH-${suffix}`,
    featured: true,
    tags: ["single-origin", "floral"],
  });
  await products.create(published);

  const draft = baseProduct({
    name: `${searchWord} Draft Reserve`,
    sku: `DRAFT-${suffix}`,
    status: "draft",
    visibility: "hidden",
  });
  await products.create(draft);

  const hiddenVisibility = baseProduct({
    name: `${searchWord} Hidden Reserve`,
    sku: `HIDDEN-${suffix}`,
    status: "active",
    visibility: "hidden",
  });
  await products.create(hiddenVisibility);

  const withVariants = baseProduct({
    name: `Variant Blend ${suffix}`,
    sku: `VAR-${suffix}`,
    hasVariants: true,
    variants: [
      {
        id: randomUUID(),
        sku: `VAR-${suffix}-250`,
        attributeSelections: { size: "250g" },
        priceOverride: 1500,
        status: "active",
        trackInventory: false,
        allowBackorder: false,
      },
      {
        id: randomUUID(),
        sku: `VAR-${suffix}-500`,
        attributeSelections: { size: "500g" },
        priceOverride: 2800,
        status: "active",
        trackInventory: false,
        allowBackorder: false,
      },
    ],
  });
  await products.create(withVariants);

  return { category, inactiveCategory, brand, published, draft, hiddenVisibility, withVariants, searchWord };
}

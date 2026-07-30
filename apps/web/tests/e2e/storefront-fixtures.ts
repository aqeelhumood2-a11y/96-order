import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { Product } from "@/core/catalog/entities";
import { FirestoreProductRepository } from "@/infrastructure/firebase/repositories/firestore-product-repository";
import { CATALOG_SEED_EMAIL, CATALOG_SEED_PASSWORD } from "./global-setup";

const products = new FirestoreProductRepository();

export interface StorefrontFixtures {
  categoryName: string;
  categorySlug: string;
  inactiveCategorySlug: string;
  brandName: string;
  brandSlug: string;
  published: Product;
  draft: Product;
  hiddenVisibility: Product;
  withVariants: Product;
  searchWord: string;
}

async function loginAsCatalogSeed(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(CATALOG_SEED_EMAIL);
  await page.getByLabel("Password").fill(CATALOG_SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

async function createCategory(page: Page, name: string, slug: string, active: boolean): Promise<void> {
  await page.goto("/admin/categories");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel(/^Slug/).fill(slug);
  if (!active) {
    await page.getByLabel("Active").uncheck();
  }
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText(name).first()).toBeVisible();
}

async function createBrand(page: Page, name: string, slug: string): Promise<void> {
  await page.goto("/admin/brands");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel(/^Slug/).fill(slug);
  await page.getByRole("button", { name: "Create brand" }).click();
  await expect(page.getByText(name).first()).toBeVisible();
}

interface CreateProductOptions {
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  brandName: string;
  status?: "draft" | "active" | "archived";
  visibility?: "visible" | "hidden";
  featured?: boolean;
}

/**
 * Creates the product through the real admin UI (and therefore the real
 * `create-product` Server Action, which correctly calls
 * `revalidateStorefrontTag` on success) rather than writing straight to
 * Firestore — a fixture written directly to Firestore would leave the
 * homepage's cached "featured products"/"new arrivals" reads (keyed on a
 * fixed argument, not per-product) stale for the rest of this test run,
 * since nothing would ever invalidate them. Reading the persisted product
 * back by id afterward (a plain read, no side effects) is just the
 * simplest way to get its exact generated fields back into the test.
 */
async function createProduct(page: Page, options: CreateProductOptions): Promise<Product> {
  await page.goto("/admin/products/new");
  await page.getByLabel("Name", { exact: true }).fill(options.name);
  await page.getByLabel(/^Slug/).fill(options.slug);
  await page.getByLabel("Product type (e.g. coffee_beans, grinder)").fill("coffee_beans");
  await page.getByLabel("Primary category").selectOption({ label: options.categoryName });
  await page.getByLabel("Brand").selectOption({ label: options.brandName });
  await page.getByLabel("SKU").fill(options.sku);
  await page.getByLabel("Base price").fill("1899");
  if (options.status) await page.getByLabel("Status").selectOption(options.status);
  if (options.visibility) await page.getByLabel("Visibility").selectOption(options.visibility);
  if (options.featured) await page.getByLabel("Featured").check();
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page.getByRole("heading", { name: options.name })).toBeVisible();
  const match = page.url().match(/\/admin\/products\/([^/]+)$/);
  const productId = match?.[1];
  if (!productId) throw new Error(`Could not extract product id from URL: ${page.url()}`);

  const product = await products.findById(productId);
  if (!product) throw new Error(`Product ${productId} was created but could not be read back`);
  return product;
}

/**
 * The one exception to "seed through the real UI": a product with
 * variants. The admin variant editor's inputs aren't associated with their
 * `<Label>`s via `htmlFor`/`id`, which makes driving it through Playwright
 * fragile and isn't what this suite is testing anyway (that's Phase 3
 * admin-UI territory). This product is never featured/new-arrival-listed,
 * so it has no fixed-key cache entry to go stale — a direct create is safe.
 */
async function createVariantProduct(categoryId: string, brandId: string, suffix: string): Promise<Product> {
  const now = new Date();
  const product: Product = {
    id: randomUUID(),
    name: `Variant Blend ${suffix}`,
    slug: `variant-blend-${suffix}`,
    brandId,
    primaryCategoryId: categoryId,
    additionalCategoryIds: [],
    productType: "coffee_beans",
    status: "active",
    visibility: "visible",
    featured: false,
    sku: `VAR-${suffix}`,
    basePrice: 1899,
    trackInventory: false,
    allowBackorder: false,
    tags: [],
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
    images: [],
    searchTokens: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: "e2e-storefront-setup",
    updatedBy: "e2e-storefront-setup",
  };
  await products.create(product);
  return product;
}

export async function seedStorefrontFixtures(page: Page): Promise<StorefrontFixtures> {
  const suffix = randomUUID().slice(0, 8);
  const searchWord = `zephyrella${suffix}`;
  const categoryName = `Single Origin ${suffix}`;
  const categorySlug = `single-origin-${suffix}`;
  const inactiveCategorySlug = `retired-category-${suffix}`;
  const brandName = `Storefront Roasters ${suffix}`;
  const brandSlug = `storefront-roasters-${suffix}`;

  await loginAsCatalogSeed(page);
  await createCategory(page, categoryName, categorySlug, true);
  await createCategory(page, `Retired Category ${suffix}`, inactiveCategorySlug, false);
  await createBrand(page, brandName, brandSlug);

  const published = await createProduct(page, {
    name: `${searchWord} Ethiopia`,
    slug: `published-${suffix}`,
    sku: `ETH-${suffix}`,
    categoryName,
    brandName,
    status: "active",
    visibility: "visible",
    featured: true,
  });

  const draft = await createProduct(page, {
    name: `${searchWord} Draft Reserve`,
    slug: `draft-${suffix}`,
    sku: `DRAFT-${suffix}`,
    categoryName,
    brandName,
  });

  const hiddenVisibility = await createProduct(page, {
    name: `${searchWord} Hidden Reserve`,
    slug: `hidden-${suffix}`,
    sku: `HIDDEN-${suffix}`,
    categoryName,
    brandName,
    status: "active",
    visibility: "hidden",
  });

  const withVariants = await createVariantProduct(published.primaryCategoryId, published.brandId!, suffix);

  return {
    categoryName,
    categorySlug,
    inactiveCategorySlug,
    brandName,
    brandSlug,
    published,
    draft,
    hiddenVisibility,
    withVariants,
    searchWord,
  };
}

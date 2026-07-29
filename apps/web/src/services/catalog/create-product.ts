import { randomUUID } from "node:crypto";
import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import type { Product, ProductVariant } from "@/core/catalog/entities";
import { type CreateProductInput, createProductSchema } from "@/core/catalog/schemas";
import { ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";
import { assertNoDuplicateCategoryAssignment, validateVariantsInput } from "./product-validation";

async function assertCategoriesExist(deps: CatalogDeps, primaryCategoryId: string, additionalCategoryIds: readonly string[]): Promise<void> {
  const ids = [primaryCategoryId, ...additionalCategoryIds];
  const categories = await Promise.all(ids.map((id) => deps.categories.findById(id)));
  const missingIndex = categories.findIndex((category) => category === null);
  if (missingIndex !== -1) {
    throw new ValidationError(`Category not found: "${ids[missingIndex]}".`);
  }
}

export async function createProduct(
  actor: Session,
  input: CreateProductInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<Product> {
  requirePermission(actor, "products:create");
  const parsed = createProductSchema.parse(input);

  const slug = parsed.slug ?? slugify(parsed.name);
  if (!slug) {
    throw new ValidationError("Could not derive a slug from this name — provide one explicitly.");
  }

  if (parsed.hasVariants && parsed.variants.length === 0) {
    throw new ValidationError("A product marked as having variants needs at least one variant.");
  }
  validateVariantsInput(parsed.sku, parsed.barcode, parsed.variants);
  assertNoDuplicateCategoryAssignment(parsed.primaryCategoryId, parsed.additionalCategoryIds);

  await assertCategoriesExist(deps, parsed.primaryCategoryId, parsed.additionalCategoryIds);
  if (parsed.brandId) {
    const brand = await deps.brands.findById(parsed.brandId);
    if (!brand) {
      throw new ValidationError("Brand not found.");
    }
  }

  const now = new Date();
  const variants: ProductVariant[] = parsed.variants.map((variant) => ({
    id: variant.id ?? randomUUID(),
    sku: variant.sku,
    barcode: variant.barcode,
    priceOverride: variant.priceOverride,
    compareAtPriceOverride: variant.compareAtPriceOverride,
    costOverride: variant.costOverride,
    weightGramsOverride: variant.weightGramsOverride,
    attributeSelections: variant.attributeSelections,
    status: variant.status,
    trackInventory: variant.trackInventory,
    allowBackorder: variant.allowBackorder,
    lowStockThreshold: variant.lowStockThreshold,
  }));

  const product: Product = {
    id: randomUUID(),
    name: parsed.name,
    slug,
    shortDescription: parsed.shortDescription,
    fullDescription: parsed.fullDescription,
    brandId: parsed.brandId,
    primaryCategoryId: parsed.primaryCategoryId,
    additionalCategoryIds: parsed.additionalCategoryIds,
    productType: parsed.productType,
    status: parsed.status,
    visibility: parsed.visibility,
    featured: parsed.featured,
    sku: parsed.sku,
    barcode: parsed.barcode,
    basePrice: parsed.basePrice,
    compareAtPrice: parsed.compareAtPrice,
    costPrice: parsed.costPrice,
    taxClass: parsed.taxClass,
    trackInventory: parsed.trackInventory,
    allowBackorder: parsed.allowBackorder,
    lowStockThreshold: parsed.lowStockThreshold,
    weightGrams: parsed.weightGrams,
    dimensions: parsed.dimensions,
    tags: parsed.tags,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    hasVariants: parsed.hasVariants,
    variants,
    attributes: parsed.attributes,
    images: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };

  await deps.products.create(product);

  // Best-effort seeding, not part of the product-creation transaction: an
  // inventory record is trivially re-creatable (`ensureExists` is
  // idempotent and is also called defensively wherever inventory is read),
  // so a failure here doesn't leave the catalog in a broken state — only a
  // product that briefly has no inventory record until the next read.
  if (product.hasVariants) {
    await Promise.all(
      variants
        .filter((variant) => variant.trackInventory)
        .map((variant) => deps.inventory.ensureExists(product.id, variant.id, variant.lowStockThreshold, actor.uid)),
    );
  } else if (product.trackInventory) {
    await deps.inventory.ensureExists(product.id, null, product.lowStockThreshold, actor.uid);
  }

  await deps.auditLogs.record({
    type: "product_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId: product.id, slug, sku: product.sku },
  });

  return product;
}

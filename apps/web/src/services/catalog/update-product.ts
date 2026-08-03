import { randomUUID } from "node:crypto";
import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import type { Product, ProductVariant } from "@/core/catalog/entities";
import { buildSearchTokens } from "@/core/catalog/rules";
import { type UpdateProductInput, updateProductSchema } from "@/core/catalog/schemas";
import { NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";
import { assertNoDuplicateCategoryAssignment, validateVariantsInput } from "./product-validation";

export async function updateProduct(
  actor: Session,
  productId: string,
  input: UpdateProductInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<void> {
  requirePermission(actor, "products:edit");
  const parsed = updateProductSchema.parse(input);
  const { version, variants: rawVariants, ...fields } = parsed;

  const existing = await deps.products.findById(productId);
  if (!existing) {
    throw new NotFoundError("Product not found.");
  }

  const nextPrimaryCategoryId = fields.primaryCategoryId ?? existing.primaryCategoryId;
  const nextAdditionalCategoryIds = fields.additionalCategoryIds ?? existing.additionalCategoryIds;
  if (fields.primaryCategoryId !== undefined || fields.additionalCategoryIds !== undefined) {
    assertNoDuplicateCategoryAssignment(nextPrimaryCategoryId, nextAdditionalCategoryIds);
    const ids = [nextPrimaryCategoryId, ...nextAdditionalCategoryIds];
    const categories = await Promise.all(ids.map((id) => deps.categories.findById(id)));
    const missingIndex = categories.findIndex((category) => category === null);
    if (missingIndex !== -1) {
      throw new ValidationError(`Category not found: "${ids[missingIndex]}".`);
    }
  }

  if ("brandId" in fields && fields.brandId) {
    const brand = await deps.brands.findById(fields.brandId);
    if (!brand) {
      throw new ValidationError("Brand not found.");
    }
  }

  const nextBrandId = "brandId" in fields ? fields.brandId : existing.brandId;
  const nextSku = fields.sku ?? existing.sku;
  const nextBarcode = "barcode" in fields ? fields.barcode : existing.barcode;

  let nextVariants: ProductVariant[] | undefined;
  if (rawVariants !== undefined) {
    nextVariants = rawVariants.map((variant) => ({
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
    validateVariantsInput(nextSku, nextBarcode, rawVariants);
  }

  const nextHasVariants = fields.hasVariants ?? existing.hasVariants;
  if (nextHasVariants && (nextVariants ?? existing.variants).length === 0) {
    throw new ValidationError("A product marked as having variants needs at least one variant.");
  }

  const slug = fields.slug ?? (fields.name !== undefined ? slugify(fields.name) : undefined);

  // Recomputed on every update (cheap pure string processing) rather than
  // only when a search-relevant field changed — simpler and can't drift
  // out of sync with whichever fields actually changed. One extra doc read
  // each for the (possibly unchanged) primary category/brand, to get their
  // current names; acceptable on this admin-only write path.
  const [effectivePrimaryCategory, effectiveBrand] = await Promise.all([
    deps.categories.findById(nextPrimaryCategoryId),
    nextBrandId ? deps.brands.findById(nextBrandId) : Promise.resolve(null),
  ]);
  const nextAttributes = fields.attributes ?? existing.attributes;
  const searchTokens = buildSearchTokens({
    name: fields.name ?? existing.name,
    sku: nextSku,
    barcode: nextBarcode,
    tags: fields.tags ?? existing.tags,
    productType: fields.productType ?? existing.productType,
    brandName: effectiveBrand?.name,
    categoryName: effectivePrimaryCategory?.name,
    variantSkus: (nextVariants ?? existing.variants).map((variant) => variant.sku),
    coffeeOriginCountry: nextAttributes?.coffee?.originCountry,
    coffeeRegion: nextAttributes?.coffee?.region,
  });

  const patch: Partial<Product> = {
    ...fields,
    ...(slug !== undefined ? { slug } : {}),
    ...(nextVariants !== undefined ? { variants: nextVariants } : {}),
    searchTokens,
    updatedBy: actor.uid,
  };

  await deps.products.update(productId, patch, version);

  await deps.auditLogs.record({
    type: "product_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId, changedFields: [...Object.keys(fields), ...(rawVariants !== undefined ? ["variants"] : [])] },
  });
}

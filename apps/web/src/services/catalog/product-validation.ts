import { isCompareAtPriceValid, normalizeCatalogCode, variantSelectionsKey } from "@/core/catalog/rules";
import type { VariantInput } from "@/core/catalog/schemas";
import { ValidationError } from "@/core/errors";

/**
 * Cross-variant checks that only make sense looking at the *whole* incoming
 * variant list together — duplicate SKU/barcode/attribute-combination
 * within one product. This is deliberately separate from the
 * `catalogUniqueKeys` transaction in the Firestore repository: that
 * transaction only catches a value colliding with a *different* product,
 * because claiming the same key twice for the same owner in one
 * transaction is a no-op, not a conflict. Two variants in the same
 * `create`/`update` call with an identical SKU would otherwise slip
 * through silently.
 */
export function validateVariantsInput(productSku: string, productBarcode: string | undefined, variants: readonly VariantInput[]): void {
  const skuSeen = new Set<string>([normalizeCatalogCode(productSku)]);
  const barcodeSeen = new Set<string>(productBarcode ? [normalizeCatalogCode(productBarcode)] : []);
  const comboSeen = new Set<string>();

  for (const variant of variants) {
    if (
      variant.priceOverride !== undefined &&
      variant.compareAtPriceOverride !== undefined &&
      !isCompareAtPriceValid(variant.priceOverride, variant.compareAtPriceOverride)
    ) {
      throw new ValidationError(`Variant "${variant.sku}": compare-at price must be greater than the price.`);
    }

    const normalizedSku = normalizeCatalogCode(variant.sku);
    if (skuSeen.has(normalizedSku)) {
      throw new ValidationError(`Duplicate SKU within this product: "${variant.sku}".`);
    }
    skuSeen.add(normalizedSku);

    if (variant.barcode) {
      const normalizedBarcode = normalizeCatalogCode(variant.barcode);
      if (barcodeSeen.has(normalizedBarcode)) {
        throw new ValidationError(`Duplicate barcode within this product: "${variant.barcode}".`);
      }
      barcodeSeen.add(normalizedBarcode);
    }

    const comboKey = variantSelectionsKey(variant.attributeSelections);
    if (comboSeen.has(comboKey)) {
      throw new ValidationError("Duplicate variant attribute combination within this product.");
    }
    comboSeen.add(comboKey);
  }
}

/**
 * A product's `additionalCategoryIds` must never repeat its own
 * `primaryCategoryId` — besides being a redundant assignment, it would let
 * `ProductRepository.countByCategory()`'s two separate `count()` queries
 * (one on `primaryCategoryId`, one `array-contains` on
 * `additionalCategoryIds`) double-count the same product.
 */
export function assertNoDuplicateCategoryAssignment(primaryCategoryId: string, additionalCategoryIds: readonly string[]): void {
  if (additionalCategoryIds.includes(primaryCategoryId)) {
    throw new ValidationError("The primary category cannot also be listed as an additional category.");
  }
}

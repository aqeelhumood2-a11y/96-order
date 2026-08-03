import { computeAvailableQuantity } from "@/core/catalog/rules";
import { computeAvailability, isPubliclyVisible } from "@/core/storefront/rules";
import type { CartLine } from "@/core/cart/entities";
import { cartLineKey, type CartLineCatalogSnapshot } from "@/core/cart/rules";
import { money } from "@/core/money/money";
import type { CartDeps } from "./dependencies";

/**
 * Fetches every distinct product a cart's lines reference and builds the
 * live `CartLineCatalogSnapshot` map `core/cart/rules.ts#priceCart` needs
 * — this is the one place cart pricing/validation actually touches
 * Firestore. A line whose product no longer resolves, isn't publicly
 * visible, or references a variant that no longer exists/isn't active
 * simply has no entry in the returned map — `priceCart` already treats a
 * missing snapshot as `"product_unavailable"`.
 */
export async function buildCatalogSnapshots(lines: readonly CartLine[], deps: CartDeps): Promise<Map<string, CartLineCatalogSnapshot>> {
  const distinctProductIds = Array.from(new Set(lines.map((line) => line.productId)));
  const products = await Promise.all(distinctProductIds.map((id) => deps.products.findById(id)));
  const productById = new Map(distinctProductIds.map((id, index) => [id, products[index] ?? null]));

  const snapshots = new Map<string, CartLineCatalogSnapshot>();

  await Promise.all(
    lines.map(async (line) => {
      const product = productById.get(line.productId) ?? null;
      if (!product || !isPubliclyVisible(product)) return;

      const variant = line.variantId ? product.variants.find((candidate) => candidate.id === line.variantId) : null;
      if (line.variantId && (!variant || variant.status !== "active")) return;

      const trackInventory = variant ? variant.trackInventory : product.trackInventory;
      const allowBackorder = variant ? variant.allowBackorder : product.allowBackorder;
      const record = await deps.inventory.findByProductAndVariant(product.id, line.variantId);
      const availability = computeAvailability(record, allowBackorder, trackInventory);
      const maxQuantity = trackInventory && !allowBackorder && record ? Math.max(0, computeAvailableQuantity(record)) : undefined;

      const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];
      const imageUrl = primaryImage ? await deps.images.getDownloadUrl(primaryImage.storagePath) : null;

      snapshots.set(cartLineKey(product.id, line.variantId), {
        name: product.name,
        slug: product.slug,
        sku: variant?.sku ?? product.sku,
        variantAttributes: variant?.attributeSelections,
        imageUrl,
        unitPrice: money(variant?.priceOverride ?? product.basePrice),
        isAvailableForSale: true,
        availability,
        allowBackorder,
        trackInventory,
        maxQuantity,
        categoryIds: [product.primaryCategoryId, ...product.additionalCategoryIds],
        brandId: product.brandId,
      });
    }),
  );

  return snapshots;
}

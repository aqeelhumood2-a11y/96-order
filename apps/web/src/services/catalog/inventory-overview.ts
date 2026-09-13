import type { Session } from "@/core/auth/entities";
import type { InventoryRecord, Product, ProductVariant } from "@/core/catalog/entities";
import { hasPermission } from "@/core/auth/permissions";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export interface InventoryOverviewRow {
  product: Product;
  variant: ProductVariant | null;
  record: InventoryRecord | null;
}

/**
 * Joins a page of products with their inventory record(s) for the
 * `/admin/inventory` overview table. One query per product
 * (`listByProduct`, which returns every variant-level record for that
 * product together) rather than one per variant — the N+1 here is
 * per-product, not per-variant, and is an accepted tradeoff for Phase 3's
 * expected catalog size (see README's Known limitations).
 */
export async function listInventoryOverview(
  actor: Session,
  request: { limit: number },
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<InventoryOverviewRow[]> {
  requirePermission(actor, "inventory:view");

  const productsPage = await deps.products.list({ limit: request.limit });
  const rows: InventoryOverviewRow[] = [];

  for (const product of productsPage.items) {
    if (product.hasVariants) {
      const records = await deps.inventory.listByProduct(product.id);
      const recordByVariantId = new Map(records.map((record) => [record.variantId, record]));
      for (const variant of product.variants) {
        rows.push({ product, variant, record: recordByVariantId.get(variant.id) ?? null });
      }
    } else if (product.trackInventory) {
      const record = await deps.inventory.findByProductAndVariant(product.id, null);
      rows.push({ product, variant: null, record });
    }
  }

  return rows;
}

/**
 * A single product's own inventory record(s), shaped identically to
 * `listInventoryOverview`'s rows so the product edit page can reuse
 * `<InventoryTable>` directly to show live stock right there instead of
 * only in the separate `/admin/inventory` overview. Returns `[]` (not an
 * error) when the viewer lacks `inventory:view` — the product edit page
 * renders nothing extra rather than a forbidden page, since the rest of
 * that page is already gated on `products:edit`, a different permission.
 */
export async function getProductInventory(actor: Session, product: Product, deps: CatalogDeps = defaultCatalogDeps): Promise<InventoryOverviewRow[]> {
  if (!hasPermission(actor, "inventory:view")) return [];

  if (product.hasVariants) {
    const records = await deps.inventory.listByProduct(product.id);
    const recordByVariantId = new Map(records.map((record) => [record.variantId, record]));
    return product.variants.map((variant) => ({ product, variant, record: recordByVariantId.get(variant.id) ?? null }));
  }

  if (!product.trackInventory) return [];
  const record = await deps.inventory.findByProductAndVariant(product.id, null);
  return [{ product, variant: null, record }];
}

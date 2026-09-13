import { computeAvailableQuantity } from "@/core/catalog/rules";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import type { InventoryOverviewRow } from "@/services/catalog/inventory-overview";
import { AdjustInventoryForm } from "./adjust-inventory-form";

export function InventoryTable({ rows, canAdjust, locale = DEFAULT_LOCALE }: { rows: InventoryOverviewRow[]; canAdjust: boolean; locale?: Locale }) {
  const dict = getDictionary(locale).admin.inventoryPage;

  if (rows.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noInventory}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map(({ product, variant, record }) => {
        const onHand = record?.onHand ?? 0;
        const reserved = record?.reserved ?? 0;
        const available = record ? computeAvailableQuantity(record) : 0;
        const threshold = variant?.lowStockThreshold ?? product.lowStockThreshold;
        const isLowStock = threshold !== undefined && available <= threshold;

        return (
          <div key={`${product.id}:${variant?.id ?? "-"}`} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {product.name}
                  {variant && <span className="text-foreground/69"> — {Object.values(variant.attributeSelections).join(" / ")}</span>}
                </p>
                <p className="text-xs text-foreground/65">SKU {variant?.sku ?? product.sku}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{dict.onHand}: {onHand}</span>
                <span>{dict.reserved}: {reserved}</span>
                <span className={isLowStock ? "font-semibold text-danger-600" : ""}>{dict.available}: {available}</span>
                {isLowStock && <span className="rounded bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700">{dict.lowStock}</span>}
              </div>
            </div>
            {canAdjust && <AdjustInventoryForm productId={product.id} variantId={variant?.id ?? null} locale={locale} />}
          </div>
        );
      })}
    </div>
  );
}

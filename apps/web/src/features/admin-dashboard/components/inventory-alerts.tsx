import Link from "next/link";
import type { InventoryRecord } from "@/core/catalog/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

function AlertList({
  title,
  records,
  emptyMessage,
  viewInventoryLabel,
  availabilityTemplate,
}: {
  title: string;
  records: InventoryRecord[];
  emptyMessage: string;
  viewInventoryLabel: string;
  availabilityTemplate: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">{title}</h2>
      {records.length === 0 ? (
        <p className="text-sm text-foreground/69">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">
                {record.productId}
                {record.variantId ? `:${record.variantId}` : ""}
              </span>
              <span className="text-foreground/69">
                {availabilityTemplate.replace("{available}", String(record.onHand - record.reserved)).replace("{reserved}", String(record.reserved))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/admin/inventory" className="text-xs text-brand-700 hover:underline">
        {viewInventoryLabel}
      </Link>
    </div>
  );
}

/** README's Inventory Alerts requirement — low stock, out of stock, and each row's own reserved count. */
export function InventoryAlerts({ lowStock, outOfStock, locale = DEFAULT_LOCALE }: { lowStock: InventoryRecord[]; outOfStock: InventoryRecord[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.dashboardPage;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AlertList title={dict.lowStock} records={lowStock} emptyMessage={dict.nothingLow} viewInventoryLabel={dict.viewInventory} availabilityTemplate={dict.inventoryAvailability} />
      <AlertList title={dict.outOfStock} records={outOfStock} emptyMessage={dict.nothingOut} viewInventoryLabel={dict.viewInventory} availabilityTemplate={dict.inventoryAvailability} />
    </div>
  );
}

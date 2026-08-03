import Link from "next/link";
import type { InventoryRecord } from "@/core/catalog/entities";

function AlertList({ title, records, emptyMessage }: { title: string; records: InventoryRecord[]; emptyMessage: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">{title}</h2>
      {records.length === 0 ? (
        <p className="text-sm text-foreground/60">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          {records.map((record) => (
            <li key={record.id} className="flex items-center justify-between gap-3">
              <span className="text-foreground/80">
                {record.productId}
                {record.variantId ? `:${record.variantId}` : ""}
              </span>
              <span className="text-foreground/60">
                {record.onHand - record.reserved} available ({record.reserved} reserved)
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/admin/inventory" className="text-xs text-brand-700 hover:underline">
        View inventory →
      </Link>
    </div>
  );
}

/** README's Inventory Alerts requirement — low stock, out of stock, and each row's own reserved count. */
export function InventoryAlerts({ lowStock, outOfStock }: { lowStock: InventoryRecord[]; outOfStock: InventoryRecord[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AlertList title="Low stock" records={lowStock} emptyMessage="Nothing is running low." />
      <AlertList title="Out of stock" records={outOfStock} emptyMessage="Nothing is out of stock." />
    </div>
  );
}

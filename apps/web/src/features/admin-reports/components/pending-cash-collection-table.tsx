import Link from "next/link";
import type { PendingCashCollectionRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function PendingCashCollectionTable({ rows, locale = DEFAULT_LOCALE }: { rows: PendingCashCollectionRow[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage;
  const ordersPageDict = getDictionary(locale).admin.ordersPage;

  if (rows.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noPendingCash}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.pendingCashTable.order}</th>
            <th className="px-4 py-3 font-medium">{dict.pendingCashTable.customer}</th>
            <th className="px-4 py-3 font-medium">{dict.pendingCashTable.fulfillment}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.pendingCashTable.amount}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.pendingCashTable.placed}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.orderId} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${row.orderId}`} className="font-medium text-brand-700 hover:underline">
                  {row.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">{row.customerName}</td>
              <td className="px-4 py-3 text-foreground">{row.fulfillmentMethod === "delivery" ? ordersPageDict.delivery : ordersPageDict.pickup}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(row.grandTotal)}</td>
              <td className="px-4 py-3 text-right text-foreground/69">{row.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import Link from "next/link";
import type { PendingCashCollectionRow } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function PendingCashCollectionTable({ rows }: { rows: PendingCashCollectionRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-foreground/60">No cash payments are waiting to be collected.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/60">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Fulfillment</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
            <th className="px-4 py-3 text-right font-medium">Placed</th>
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
              <td className="px-4 py-3 capitalize text-foreground">{row.fulfillmentMethod}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(row.grandTotal)}</td>
              <td className="px-4 py-3 text-right text-foreground/60">{row.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

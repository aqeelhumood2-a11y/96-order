import type { CashPaymentsSummary } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function CashPaymentsSummaryCard({ summary }: { summary: CashPaymentsSummary }) {
  const rows = [
    { label: "Pending collection", count: summary.pendingCount, total: summary.pendingTotal },
    { label: "Confirmed", count: summary.confirmedCount, total: summary.confirmedTotal },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Cash status</th>
            <th className="px-4 py-3 text-right font-medium">Orders</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3 text-foreground">{row.label}</td>
              <td className="px-4 py-3 text-right">{row.count}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-surface-border px-4 py-3 text-xs text-foreground/65">
        {summary.deliveryCount} on delivery, {summary.pickupCount} on pickup.
      </p>
    </div>
  );
}

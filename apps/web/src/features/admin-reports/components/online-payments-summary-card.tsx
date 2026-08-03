import type { OnlinePaymentsSummary } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function OnlinePaymentsSummaryCard({ summary }: { summary: OnlinePaymentsSummary }) {
  const rows = [
    { label: "Paid", count: summary.paidCount, total: summary.paidTotal },
    { label: "Refunded", count: summary.refundedCount, total: summary.refundedTotal },
    { label: "Pending", count: summary.pendingCount, total: null },
    { label: "Authorized", count: summary.authorizedCount, total: null },
    { label: "Failed", count: summary.failedCount, total: null },
    { label: "Cancelled", count: summary.cancelledCount, total: null },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/60">
          <tr>
            <th className="px-4 py-3 font-medium">Online payment status</th>
            <th className="px-4 py-3 text-right font-medium">Orders</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3 text-foreground">{row.label}</td>
              <td className="px-4 py-3 text-right">{row.count}</td>
              <td className="px-4 py-3 text-right font-medium">{row.total ? formatMoney(row.total) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

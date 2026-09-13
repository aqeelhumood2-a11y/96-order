import type { OnlinePaymentsSummary } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function OnlinePaymentsSummaryCard({ summary, locale = DEFAULT_LOCALE }: { summary: OnlinePaymentsSummary; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage.onlineSummary;
  const paymentStatusDict = getDictionary(locale).admin.paymentStatus;
  const rows = [
    { label: paymentStatusDict.paid, count: summary.paidCount, total: summary.paidTotal },
    { label: paymentStatusDict.refunded, count: summary.refundedCount, total: summary.refundedTotal },
    { label: paymentStatusDict.pending, count: summary.pendingCount, total: null },
    { label: paymentStatusDict.authorized, count: summary.authorizedCount, total: null },
    { label: paymentStatusDict.failed, count: summary.failedCount, total: null },
    { label: paymentStatusDict.cancelled, count: summary.cancelledCount, total: null },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.status}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.orders}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.total}</th>
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

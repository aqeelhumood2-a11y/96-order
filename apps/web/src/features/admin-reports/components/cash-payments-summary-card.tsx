import type { CashPaymentsSummary } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function CashPaymentsSummaryCard({ summary, locale = DEFAULT_LOCALE }: { summary: CashPaymentsSummary; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage.cashSummary;
  const rows = [
    { label: dict.pendingCollection, count: summary.pendingCount, total: summary.pendingTotal },
    { label: dict.confirmed, count: summary.confirmedCount, total: summary.confirmedTotal },
  ];

  return (
    <div className="overflow-x-auto rounded-md border border-surface-border">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-sunken text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.cashStatus}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.orders}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.total}</th>
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
        {dict.deliveryPickupSummary.replace("{delivery}", String(summary.deliveryCount)).replace("{pickup}", String(summary.pickupCount))}
      </p>
    </div>
  );
}

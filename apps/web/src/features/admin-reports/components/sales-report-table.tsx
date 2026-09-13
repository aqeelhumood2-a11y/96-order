import type { SalesBucket } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function SalesReportTable({ buckets, locale = DEFAULT_LOCALE }: { buckets: SalesBucket[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage;

  if (buckets.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noDataInRange}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.salesTable.period}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.salesTable.orders}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.salesTable.revenue}</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.periodLabel} className="border-b border-brand-50 last:border-0">
              <td className="px-4 py-3 text-foreground">{bucket.periodLabel}</td>
              <td className="px-4 py-3 text-right">{bucket.orderCount}</td>
              <td className="px-4 py-3 text-right font-medium">{formatMoney(bucket.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

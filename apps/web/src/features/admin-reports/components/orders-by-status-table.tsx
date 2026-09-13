import type { OrdersByStatusRow } from "@/core/reports/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export function OrdersByStatusTable({ rows, locale = DEFAULT_LOCALE }: { rows: OrdersByStatusRow[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage.ordersByStatusTable;
  const orderStatusDict = getDictionary(locale).admin.orderStatus;

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">{dict.status}</th>
            <th className="px-4 py-3 text-right font-medium">{dict.orders}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.status} className="border-b border-brand-50 last:border-0">
              <td className="px-4 py-3 text-foreground">{orderStatusDict[row.status]}</td>
              <td className="px-4 py-3 text-right">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

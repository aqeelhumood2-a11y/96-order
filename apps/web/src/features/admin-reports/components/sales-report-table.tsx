import type { SalesBucket } from "@/core/reports/entities";
import { formatMoney } from "@/core/money/money";

export function SalesReportTable({ buckets }: { buckets: SalesBucket[] }) {
  if (buckets.length === 0) {
    return <p className="text-sm text-foreground/69">No data in this range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 text-right font-medium">Orders</th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
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

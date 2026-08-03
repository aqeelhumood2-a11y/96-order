import type { OrdersByStatusRow } from "@/core/reports/entities";

export function OrdersByStatusTable({ rows }: { rows: OrdersByStatusRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Orders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.status} className="border-b border-brand-50 last:border-0">
              <td className="px-4 py-3 capitalize text-foreground">{row.status.replace(/_/g, " ")}</td>
              <td className="px-4 py-3 text-right">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

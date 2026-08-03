import type { ParsedReportsQuery } from "@/core/reports/schemas";
import { REPORT_PERIODS } from "@/core/reports/schemas";
import { Button, Input, Label, Select } from "@/ui/primitives";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ReportsFilters({ query }: { query: ParsedReportsQuery }) {
  return (
    <form action="/admin/reports" method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-brand-100 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-from">From</Label>
        <Input id="report-from" type="date" name="from" defaultValue={toDateInputValue(query.from)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-to">To</Label>
        <Input id="report-to" type="date" name="to" defaultValue={toDateInputValue(query.to)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-period">Sales bucketed by</Label>
        <Select id="report-period" name="period" defaultValue={query.period} className="w-32">
          {REPORT_PERIODS.map((period) => (
            <option key={period} value={period}>
              {period === "day" ? "Day" : period === "week" ? "Week" : "Month"}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}

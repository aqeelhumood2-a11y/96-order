import type { ParsedReportsQuery } from "@/core/reports/schemas";
import { REPORT_PERIODS } from "@/core/reports/schemas";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label, Select } from "@/ui/primitives";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ReportsFilters({ query, locale = DEFAULT_LOCALE }: { query: ParsedReportsQuery; locale?: Locale }) {
  const dict = getDictionary(locale).admin.reportsPage;
  return (
    <form action="/admin/reports" method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-brand-100 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-from">{dict.from}</Label>
        <Input id="report-from" type="date" name="from" defaultValue={toDateInputValue(query.from)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-to">{dict.to}</Label>
        <Input id="report-to" type="date" name="to" defaultValue={toDateInputValue(query.to)} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="report-period">{dict.salesBucketedBy}</Label>
        <Select id="report-period" name="period" defaultValue={query.period} className="w-32">
          {REPORT_PERIODS.map((period) => (
            <option key={period} value={period}>
              {period === "day" ? dict.day : period === "week" ? dict.week : dict.month}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        {dict.apply}
      </Button>
    </form>
  );
}

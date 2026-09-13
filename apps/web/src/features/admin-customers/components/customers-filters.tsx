import type { ParsedListCustomersQuery } from "@/core/customer/schemas";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label } from "@/ui/primitives";

export function CustomersFilters({ query, locale = DEFAULT_LOCALE }: { query: ParsedListCustomersQuery; locale?: Locale }) {
  const dict = getDictionary(locale).admin.customersPage;
  return (
    <form action="/admin/customers" method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-brand-100 p-4">
      <div className="flex min-w-64 flex-1 flex-col gap-1.5">
        <Label htmlFor="customer-search">{dict.search}</Label>
        <Input id="customer-search" name="search" defaultValue={query.search ?? ""} placeholder={dict.searchPlaceholder} />
      </div>
      <Button type="submit" size="sm">
        {dict.applyFilters}
      </Button>
    </form>
  );
}

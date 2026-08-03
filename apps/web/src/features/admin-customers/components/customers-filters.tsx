import type { ParsedListCustomersQuery } from "@/core/customer/schemas";
import { Button, Input, Label } from "@/ui/primitives";

export function CustomersFilters({ query }: { query: ParsedListCustomersQuery }) {
  return (
    <form action="/admin/customers" method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-brand-100 p-4">
      <div className="flex min-w-64 flex-1 flex-col gap-1.5">
        <Label htmlFor="customer-search">Search</Label>
        <Input id="customer-search" name="search" defaultValue={query.search ?? ""} placeholder="Name, phone, or email" />
      </div>
      <Button type="submit" size="sm">
        Apply filters
      </Button>
    </form>
  );
}

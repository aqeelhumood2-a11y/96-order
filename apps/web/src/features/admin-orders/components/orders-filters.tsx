import { FULFILLMENT_METHODS } from "@/core/delivery/entities";
import { ORDER_STATUSES } from "@/core/orders/entities";
import { ORDER_SORT_FIELDS, type ParsedListOrdersQuery } from "@/core/orders/schemas";
import { PAYMENT_STATUSES } from "@/core/payments/entities";
import { Button, Input, Label, Select } from "@/ui/primitives";

function toDateInputValue(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/**
 * A plain GET form — same progressive-enhancement approach as
 * `features/storefront/listing/filter-panel.tsx` (see its doc comment).
 * Submitting always drops `cursor`/`cursors`, resetting pagination to page
 * one whenever a filter changes.
 */
export function OrdersFilters({ query }: { query: ParsedListOrdersQuery }) {
  return (
    <form action="/admin/orders" method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-brand-100 p-4">
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <Label htmlFor="order-search">Search</Label>
        <Input id="order-search" name="search" defaultValue={query.search ?? ""} placeholder="Order #, name, phone, or email" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-status">Status</Label>
        <Select id="order-status" name="status" defaultValue={query.status ?? ""} className="w-44">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-payment-status">Payment status</Label>
        <Select id="order-payment-status" name="paymentStatus" defaultValue={query.paymentStatus ?? ""} className="w-44">
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-fulfillment">Delivery/Pickup</Label>
        <Select id="order-fulfillment" name="fulfillmentMethod" defaultValue={query.fulfillmentMethod ?? ""} className="w-36">
          <option value="">Both</option>
          {FULFILLMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method === "delivery" ? "Delivery" : "Pickup"}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-date-from">From</Label>
        <Input id="order-date-from" type="date" name="dateFrom" defaultValue={toDateInputValue(query.dateFrom)} className="w-40" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-date-to">To</Label>
        <Input id="order-date-to" type="date" name="dateTo" defaultValue={toDateInputValue(query.dateTo)} className="w-40" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-sort">Sort by</Label>
        <Select id="order-sort" name="sort" defaultValue={query.sort} className="w-36">
          {ORDER_SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {field === "createdAt" ? "Date" : field === "grandTotal" ? "Total" : "Order #"}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-direction">Direction</Label>
        <Select id="order-direction" name="direction" defaultValue={query.direction} className="w-32">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
      </div>

      <Button type="submit" size="sm">
        Apply filters
      </Button>
    </form>
  );
}

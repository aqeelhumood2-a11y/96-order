import { FULFILLMENT_METHODS } from "@/core/delivery/entities";
import { ORDER_STATUSES } from "@/core/orders/entities";
import { ORDER_SORT_FIELDS, type ParsedListOrdersQuery } from "@/core/orders/schemas";
import { PAYMENT_STATUSES } from "@/core/payments/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button, Input, Label, Select } from "@/ui/primitives";

function toDateInputValue(date: Date | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/**
 * A plain GET form — same progressive-enhancement approach as
 * `features/storefront/listing/filter-panel.tsx` (see its doc comment).
 * Submitting always drops `cursor`/`cursors`, resetting pagination to page
 * one whenever a filter changes. Search + status are the two filters
 * actually used day to day and stay visible; the rest (payment status,
 * fulfillment, date range, sort) are collapsed behind "Advanced filters"
 * — opened by default only when one of them is already set, so an active
 * advanced filter is never hidden away after the page reloads.
 */
export function OrdersFilters({ query, locale = DEFAULT_LOCALE }: { query: ParsedListOrdersQuery; locale?: Locale }) {
  const dict = getDictionary(locale).admin.ordersPage;
  const orderStatusDict = getDictionary(locale).admin.orderStatus;
  const paymentStatusDict = getDictionary(locale).admin.paymentStatus;
  const hasAdvancedFilter = Boolean(query.paymentStatus || query.fulfillmentMethod || query.dateFrom || query.dateTo || query.sort !== "createdAt" || query.direction !== "desc");

  return (
    <form action="/admin/orders" method="get" className="flex flex-col gap-4 rounded-md border border-brand-100 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <Label htmlFor="order-search">{dict.search}</Label>
          <Input id="order-search" name="search" defaultValue={query.search ?? ""} placeholder={dict.searchPlaceholder} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="order-status">{dict.status}</Label>
          <Select id="order-status" name="status" defaultValue={query.status ?? ""} className="w-44">
            <option value="">{dict.allStatuses}</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {orderStatusDict[status]}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" size="sm">
          {dict.applyFilters}
        </Button>
      </div>

      <details className="group" open={hasAdvancedFilter}>
        <summary className="cursor-pointer text-sm font-medium text-brand-800 select-none">{dict.advancedFilters}</summary>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-payment-status">{dict.paymentStatus}</Label>
            <Select id="order-payment-status" name="paymentStatus" defaultValue={query.paymentStatus ?? ""} className="w-44">
              <option value="">{dict.allPaymentStatuses}</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusDict[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-fulfillment">{dict.fulfillment}</Label>
            <Select id="order-fulfillment" name="fulfillmentMethod" defaultValue={query.fulfillmentMethod ?? ""} className="w-36">
              <option value="">{dict.both}</option>
              {FULFILLMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method === "delivery" ? dict.delivery : dict.pickup}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-date-from">{dict.dateFrom}</Label>
            <Input id="order-date-from" type="date" name="dateFrom" defaultValue={toDateInputValue(query.dateFrom)} className="w-40" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-date-to">{dict.dateTo}</Label>
            <Input id="order-date-to" type="date" name="dateTo" defaultValue={toDateInputValue(query.dateTo)} className="w-40" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-sort">{dict.sortBy}</Label>
            <Select id="order-sort" name="sort" defaultValue={query.sort} className="w-36">
              {ORDER_SORT_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field === "createdAt" ? dict.sortDate : field === "grandTotal" ? dict.sortTotal : dict.sortOrderNumber}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="order-direction">{dict.direction}</Label>
            <Select id="order-direction" name="direction" defaultValue={query.direction} className="w-32">
              <option value="desc">{dict.newestFirst}</option>
              <option value="asc">{dict.oldestFirst}</option>
            </Select>
          </div>
        </div>
      </details>
    </form>
  );
}

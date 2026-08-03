import { listOrdersQuerySchema, type ParsedListOrdersQuery } from "@/core/orders/schemas";

/** Next.js hands page `searchParams` as possibly-repeated values; every filter here is single-valued, so the first occurrence wins. */
export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Converts raw URL search params into a validated `ParsedListOrdersQuery`
 * — same "degrade to defaults rather than throw on a stale/hand-edited
 * URL" convention as `features/storefront/listing/parse-search-params.ts#parseListingSearchParams`.
 */
export function parseOrdersSearchParams(raw: Record<string, string | string[] | undefined>): ParsedListOrdersQuery {
  const candidate = {
    search: firstValue(raw.search),
    status: firstValue(raw.status),
    paymentStatus: firstValue(raw.paymentStatus),
    fulfillmentMethod: firstValue(raw.fulfillmentMethod),
    dateFrom: firstValue(raw.dateFrom),
    dateTo: firstValue(raw.dateTo),
    sort: firstValue(raw.sort),
    direction: firstValue(raw.direction),
    cursor: firstValue(raw.cursor),
  };

  const result = listOrdersQuerySchema.safeParse(candidate);
  return result.success ? result.data : listOrdersQuerySchema.parse({});
}

/** Rebuilds the canonical filter/sort query string (everything except `cursor`/`cursors`) for `CursorPagination`'s "Next"/"Previous" links — see that component's doc comment. */
export function buildOrdersFilterQueryString(query: ParsedListOrdersQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus);
  if (query.fulfillmentMethod) params.set("fulfillmentMethod", query.fulfillmentMethod);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom.toISOString().slice(0, 10));
  if (query.dateTo) params.set("dateTo", query.dateTo.toISOString().slice(0, 10));
  if (query.sort !== "createdAt") params.set("sort", query.sort);
  if (query.direction !== "desc") params.set("direction", query.direction);
  return params.toString();
}

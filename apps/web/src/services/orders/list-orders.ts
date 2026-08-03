import type { Session } from "@/core/auth/entities";
import type { ListOrdersRequest } from "@/core/interfaces/order-repository";
import type { Page } from "@/core/interfaces/repository";
import type { Order } from "@/core/orders/entities";
import { orderMatchesAllQueryWords, tokenizeOrderSearchQuery } from "@/core/orders/rules";
import type { ParsedListOrdersQuery } from "@/core/orders/schemas";
import { requirePermission } from "@/services/auth/session";
import { defaultOrderTrackingDeps, type OrderTrackingDeps } from "./dependencies";

/**
 * The admin order-management list. `query.search` (if multi-word) is
 * split into words the same way `services/storefront/search-products.ts`
 * splits a shopper's search query: the longest word becomes the one
 * Firestore `array-contains` filter (`OrderRepository.list`'s `search`
 * field), and any remaining words are checked in-memory against the
 * bounded page that query already returned — never a second Firestore
 * call, never an unbounded scan. See `core/orders/rules.ts#tokenizeOrderSearchQuery`'s
 * doc comment for why this can under-return on a multi-word query when
 * more matches exist on the next page — the same documented tradeoff
 * product search already accepts.
 *
 * `query.dateFrom`/`query.dateTo` force the underlying Firestore query to
 * sort by `createdAt` regardless of `query.sort` — Firestore requires the
 * range filter's field to be the first `orderBy`, so a custom sort and a
 * date-range filter can't be combined. The admin UI should treat "sort"
 * as reset-to-newest whenever a date filter is active.
 */
export async function listOrders(actor: Session, query: ParsedListOrdersQuery, deps: OrderTrackingDeps = defaultOrderTrackingDeps): Promise<Page<Order>> {
  requirePermission(actor, "orders:view");

  const words = query.search ? tokenizeOrderSearchQuery(query.search) : [];
  const [primaryWord] = [...words].sort((a, b) => b.length - a.length);

  const request: ListOrdersRequest = {
    limit: query.limit,
    cursor: query.cursor,
    status: query.status,
    paymentStatus: query.paymentStatus,
    fulfillmentMethod: query.fulfillmentMethod,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    sort: query.sort,
    direction: query.direction,
    search: primaryWord,
  };

  const page = await deps.orders.list(request);

  const remainingWords = words.filter((word) => word !== primaryWord);
  if (remainingWords.length === 0) {
    return page;
  }
  return { items: page.items.filter((order) => orderMatchesAllQueryWords(order, remainingWords)), nextCursor: page.nextCursor };
}

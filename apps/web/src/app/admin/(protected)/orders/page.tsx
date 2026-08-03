import { ForbiddenError } from "@/core/errors";
import { CursorPagination } from "@/features/admin-shell/components/cursor-pagination";
import { buildOrdersFilterQueryString, firstValue, parseOrdersSearchParams } from "@/features/admin-orders/parse-search-params";
import { OrdersFilters } from "@/features/admin-orders/components/orders-filters";
import { OrdersTable } from "@/features/admin-orders/components/orders-table";
import { parseCursorState } from "@/lib/cursor-pagination";
import { listOrders } from "@/services/orders/list-orders";
import { requireSession } from "@/services/auth/session";

interface OrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await requireSession();
  const raw = await searchParams;
  const query = parseOrdersSearchParams(raw);

  let page;
  try {
    page = await listOrders(session, query);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const filterQueryString = buildOrdersFilterQueryString(query);
  const cursorState = parseCursorState(query.cursor, firstValue(raw.cursors));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Orders</h1>
      <OrdersFilters query={query} />
      <OrdersTable orders={page.items} />
      <CursorPagination basePath="/admin/orders" baseQueryString={filterQueryString} cursorState={cursorState} nextCursor={page.nextCursor} />
    </div>
  );
}

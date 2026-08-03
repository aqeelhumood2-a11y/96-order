import { ForbiddenError } from "@/core/errors";
import { CursorPagination } from "@/features/admin-shell/components/cursor-pagination";
import { buildCustomersFilterQueryString, firstValue, parseCustomersSearchParams } from "@/features/admin-customers/parse-search-params";
import { CustomersFilters } from "@/features/admin-customers/components/customers-filters";
import { CustomersTable } from "@/features/admin-customers/components/customers-table";
import { parseCursorState } from "@/lib/cursor-pagination";
import { listCustomers } from "@/services/customers/list-customers";
import { requireSession } from "@/services/auth/session";

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await requireSession();
  const raw = await searchParams;
  const query = parseCustomersSearchParams(raw);

  let page;
  try {
    page = await listCustomers(session, query);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const filterQueryString = buildCustomersFilterQueryString(query);
  const cursorState = parseCursorState(query.cursor, firstValue(raw.cursors));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Customers</h1>
      <CustomersFilters query={query} />
      <CustomersTable customers={page.items} />
      <CursorPagination basePath="/admin/customers" baseQueryString={filterQueryString} cursorState={cursorState} nextCursor={page.nextCursor} />
    </div>
  );
}

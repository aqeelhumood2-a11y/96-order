import { ForbiddenError } from "@/core/errors";
import { CursorPagination } from "@/features/admin-shell/components/cursor-pagination";
import { BackInStockTable } from "@/features/admin-notifications/components/back-in-stock-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { parseCursorState } from "@/lib/cursor-pagination";
import { adminListBackInStockSubscriptions } from "@/services/back-in-stock/admin-list";
import { requireSession } from "@/services/auth/session";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 20;

export default async function AdminBackInStockPage({ searchParams }: PageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const raw = await searchParams;
  const cursor = typeof raw.cursor === "string" ? raw.cursor : undefined;
  const cursorsParam = typeof raw.cursors === "string" ? raw.cursors : undefined;

  let page;
  try {
    page = await adminListBackInStockSubscriptions(session, { limit: PAGE_SIZE, cursor });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const cursorState = parseCursorState(cursor, cursorsParam);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{getDictionary(locale).admin.backInStockPage.heading}</h1>
      <BackInStockTable subscriptions={page.items} locale={locale} />
      <CursorPagination basePath="/admin/notifications/back-in-stock" baseQueryString="" cursorState={cursorState} nextCursor={page.nextCursor} locale={locale} />
    </div>
  );
}

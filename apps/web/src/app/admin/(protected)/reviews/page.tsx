import { ForbiddenError } from "@/core/errors";
import type { ReviewStatus } from "@/core/reviews/entities";
import { REVIEW_STATUSES } from "@/core/reviews/entities";
import { CursorPagination } from "@/features/admin-shell/components/cursor-pagination";
import { AdminReviewsTable } from "@/features/admin-reviews/components/reviews-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { parseCursorState } from "@/lib/cursor-pagination";
import { adminListReviews } from "@/services/reviews/admin-list-reviews";
import { requireSession } from "@/services/auth/session";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 20;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const raw = await searchParams;
  const cursor = firstValue(raw.cursor);
  const cursorsParam = firstValue(raw.cursors);
  const statusParam = firstValue(raw.status);
  const status = statusParam && (REVIEW_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as ReviewStatus) : undefined;

  let page;
  try {
    page = await adminListReviews(session, { limit: PAGE_SIZE, cursor, status });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!page) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const cursorState = parseCursorState(cursor, cursorsParam);
  const baseQueryString = status ? `status=${status}` : "";
  const dict = getDictionary(locale).admin.reviewsPage;
  const reviewStatusDict = getDictionary(locale).admin.reviewStatus;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
      <div className="flex gap-2 text-sm">
        <a href="/admin/reviews" className={!status ? "font-semibold text-brand-950" : "text-brand-700"}>
          {dict.all}
        </a>
        {REVIEW_STATUSES.map((value) => (
          <a key={value} href={`/admin/reviews?status=${value}`} className={status === value ? "font-semibold text-brand-950" : "text-brand-700"}>
            {reviewStatusDict[value]}
          </a>
        ))}
      </div>
      <AdminReviewsTable reviews={page.items} locale={locale} />
      <CursorPagination basePath="/admin/reviews" baseQueryString={baseQueryString} cursorState={cursorState} nextCursor={page.nextCursor} />
    </div>
  );
}

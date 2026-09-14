import Link from "next/link";
import { Button } from "@/ui/primitives/button";
import { type CursorState, nextPageHref, prevPageHref } from "@/lib/cursor-pagination";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface CursorPaginationProps {
  basePath: string;
  baseQueryString: string;
  cursorState: CursorState;
  nextCursor: string | null;
  locale?: Locale;
}

export function CursorPagination({ basePath, baseQueryString, cursorState, nextCursor, locale = DEFAULT_LOCALE }: CursorPaginationProps) {
  const dict = getDictionary(locale).admin.pagination;
  const hasPrev = cursorState.cursor !== undefined;
  if (!hasPrev && !nextCursor) return null;

  return (
    <nav aria-label={dict.label} className="flex items-center justify-between gap-4">
      {hasPrev ? (
        <Button asChild variant="outline" size="sm">
          <Link href={prevPageHref(basePath, baseQueryString, cursorState)}>{dict.previous}</Link>
        </Button>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={nextPageHref(basePath, baseQueryString, cursorState, nextCursor)}>{dict.next}</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}

import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives";
import { type CursorState, nextPageHref, prevPageHref } from "./query-utils";

export interface PaginationProps {
  basePath: string;
  filterQueryString: string;
  cursorState: CursorState;
  nextCursor: string | null;
  locale?: Locale;
}

export function Pagination({ basePath, filterQueryString, cursorState, nextCursor, locale = DEFAULT_LOCALE }: PaginationProps) {
  const dict = getDictionary(locale).storefront.listing;
  const hasPrev = cursorState.cursor !== undefined;
  if (!hasPrev && !nextCursor) return null;

  return (
    <nav aria-label={dict.pagination} className="mt-8 flex items-center justify-between gap-4">
      {hasPrev ? (
        <Button asChild variant="outline">
          <Link href={prevPageHref(basePath, filterQueryString, cursorState)}>{dict.previous}</Link>
        </Button>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Button asChild variant="outline">
          <Link href={nextPageHref(basePath, filterQueryString, cursorState, nextCursor)}>{dict.next}</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}

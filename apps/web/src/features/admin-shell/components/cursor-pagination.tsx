import Link from "next/link";
import { Button } from "@/ui/primitives/button";
import { type CursorState, nextPageHref, prevPageHref } from "@/lib/cursor-pagination";

export interface CursorPaginationProps {
  basePath: string;
  baseQueryString: string;
  cursorState: CursorState;
  nextCursor: string | null;
}

export function CursorPagination({ basePath, baseQueryString, cursorState, nextCursor }: CursorPaginationProps) {
  const hasPrev = cursorState.cursor !== undefined;
  if (!hasPrev && !nextCursor) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {hasPrev ? (
        <Button asChild variant="outline" size="sm">
          <Link href={prevPageHref(basePath, baseQueryString, cursorState)}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={nextPageHref(basePath, baseQueryString, cursorState, nextCursor)}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}

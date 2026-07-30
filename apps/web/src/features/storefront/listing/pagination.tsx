import Link from "next/link";
import { Button } from "@/ui/primitives";
import { type CursorState, nextPageHref, prevPageHref } from "./query-utils";

export interface PaginationProps {
  basePath: string;
  filterQueryString: string;
  cursorState: CursorState;
  nextCursor: string | null;
}

export function Pagination({ basePath, filterQueryString, cursorState, nextCursor }: PaginationProps) {
  const hasPrev = cursorState.cursor !== undefined;
  if (!hasPrev && !nextCursor) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4">
      {hasPrev ? (
        <Button asChild variant="outline">
          <Link href={prevPageHref(basePath, filterQueryString, cursorState)}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Button asChild variant="outline">
          <Link href={nextPageHref(basePath, filterQueryString, cursorState, nextCursor)}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}

import Link from "next/link";
import { cn } from "@/lib/cn";
import { type CursorState, viewToggleHref } from "./query-utils";

export interface ViewToggleProps {
  basePath: string;
  filterQueryString: string;
  cursorState: CursorState;
  view: "grid" | "list";
}

export function ViewToggle({ basePath, filterQueryString, cursorState, view }: ViewToggleProps) {
  return (
    <div role="group" aria-label="Layout" className="inline-flex overflow-hidden rounded-md border border-brand-300">
      <Link
        href={viewToggleHref(basePath, filterQueryString, cursorState, "grid")}
        aria-current={view === "grid" ? "true" : undefined}
        className={cn("px-3 py-1.5 text-sm font-medium", view === "grid" ? "bg-brand-600 text-white" : "text-brand-900 hover:bg-brand-50")}
      >
        Grid
      </Link>
      <Link
        href={viewToggleHref(basePath, filterQueryString, cursorState, "list")}
        aria-current={view === "list" ? "true" : undefined}
        className={cn("border-l border-brand-300 px-3 py-1.5 text-sm font-medium", view === "list" ? "bg-brand-600 text-white" : "text-brand-900 hover:bg-brand-50")}
      >
        List
      </Link>
    </div>
  );
}

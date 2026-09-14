import Link from "next/link";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { type CursorState, viewToggleHref } from "./query-utils";

export interface ViewToggleProps {
  basePath: string;
  filterQueryString: string;
  cursorState: CursorState;
  view: "grid" | "list";
  locale?: Locale;
}

export function ViewToggle({ basePath, filterQueryString, cursorState, view, locale = DEFAULT_LOCALE }: ViewToggleProps) {
  const dict = getDictionary(locale).storefront.listing;

  return (
    <div role="group" aria-label={dict.layout} className="inline-flex overflow-hidden rounded-md border border-brand-300">
      <Link
        href={viewToggleHref(basePath, filterQueryString, cursorState, "grid")}
        aria-current={view === "grid" ? "true" : undefined}
        className={cn("px-3 py-1.5 text-sm font-medium", view === "grid" ? "bg-brand-600 text-white" : "text-brand-900 hover:bg-brand-50")}
      >
        {dict.grid}
      </Link>
      <Link
        href={viewToggleHref(basePath, filterQueryString, cursorState, "list")}
        aria-current={view === "list" ? "true" : undefined}
        className={cn("border-l border-brand-300 px-3 py-1.5 text-sm font-medium", view === "list" ? "bg-brand-600 text-white" : "text-brand-900 hover:bg-brand-50")}
      >
        {dict.list}
      </Link>
    </div>
  );
}

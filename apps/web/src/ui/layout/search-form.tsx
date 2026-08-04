import { Input } from "@/ui/primitives";
import { cn } from "@/lib/cn";

export interface SearchFormProps {
  className?: string;
  defaultValue?: string;
  /** Distinct id so a duplicate copy (desktop bar + mobile drawer) doesn't collide on `htmlFor`. */
  formId: string;
}

/** Plain GET form to `/search` — works without JavaScript; the search page itself progressively enhances. */
export function SearchForm({ className, defaultValue, formId }: SearchFormProps) {
  const inputId = `${formId}-q`;

  return (
    <form action="/search" method="get" role="search" className={cn("flex w-full items-center gap-2", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="relative w-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.2-3.2" />
        </svg>
        <Input
          id={inputId}
          name="q"
          type="search"
          placeholder="Search coffee, brewers, brands…"
          defaultValue={defaultValue}
          minLength={2}
          className="rounded-full border-brand-200 bg-brand-50/50 pl-10 transition-colors placeholder:text-brand-400/80 focus-visible:bg-background focus-visible:ring-secondary-500"
        />
      </div>
    </form>
  );
}

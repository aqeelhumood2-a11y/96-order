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
      <Input id={inputId} name="q" type="search" placeholder="Search coffee, brewers, brands…" defaultValue={defaultValue} minLength={2} />
    </form>
  );
}

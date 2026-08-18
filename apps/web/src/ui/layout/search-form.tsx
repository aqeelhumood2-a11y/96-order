import { Input } from "@/ui/primitives";
import { cn } from "@/lib/cn";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

export interface SearchFormProps {
  className?: string;
  defaultValue?: string;
  /** Distinct id so a duplicate copy (desktop bar + mobile drawer) doesn't collide on `htmlFor`. */
  formId: string;
  locale?: Locale;
}

/** Plain GET form to `/search` — works without JavaScript; the search page itself progressively enhances. */
export function SearchForm({ className, defaultValue, formId, locale = DEFAULT_LOCALE }: SearchFormProps) {
  const inputId = `${formId}-q`;
  const dict = getDictionary(locale);

  return (
    <form action="/search" method="get" role="search" className={cn("flex w-full items-center gap-2", className)}>
      <label htmlFor={inputId} className="sr-only">
        {dict.nav.searchLabel}
      </label>
      <Input id={inputId} name="q" type="search" placeholder={dict.nav.searchPlaceholder} defaultValue={defaultValue} minLength={2} />
    </form>
  );
}

import type { PublicProductSummary } from "@/core/storefront/dto";
import { MIN_SEARCH_QUERY_LENGTH } from "@/core/storefront/schemas";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Container } from "@/ui/layout/container";
import { EmptyState } from "@/features/storefront/shared/empty-state";
import { ProductGrid } from "@/features/storefront/listing/product-grid";
import { Pagination } from "@/features/storefront/listing/pagination";
import { parseCursorState } from "@/features/storefront/listing/query-utils";
import { SearchInput } from "./search-input";

export interface SearchPageProps {
  query: string;
  products: PublicProductSummary[];
  nextCursor: string | null;
  cursor?: string;
  cursorsParam?: string;
  locale?: Locale;
}

export function SearchPage({ query, products, nextCursor, cursor, cursorsParam, locale = DEFAULT_LOCALE }: SearchPageProps) {
  const dict = getDictionary(locale).storefront.search;
  const trimmed = query.trim();
  const filterQueryString = trimmed ? `q=${encodeURIComponent(trimmed)}` : "";
  const cursorState = parseCursorState(cursor, cursorsParam);

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-2xl text-brand-950">{dict.heading}</h1>
      <div className="mt-4 max-w-lg">
        <SearchInput initialQuery={query} locale={locale} />
      </div>

      <div className="mt-8">
        {trimmed.length === 0 && <EmptyState title={dict.startTyping} description={dict.startTypingHint} />}

        {trimmed.length > 0 && trimmed.length < MIN_SEARCH_QUERY_LENGTH && (
          <EmptyState title={dict.keepTyping} description={dict.keepTypingHint.replace("{count}", String(MIN_SEARCH_QUERY_LENGTH))} />
        )}

        {trimmed.length >= MIN_SEARCH_QUERY_LENGTH && (
          <>
            <p className="text-sm text-foreground/69" role="status">
              {products.length > 0 ? dict.resultsFor.replace("{query}", trimmed) : dict.noResultsFor.replace("{query}", trimmed)}
            </p>
            {products.length > 0 && (
              <>
                <div className="mt-4">
                  <ProductGrid products={products} view="grid" highlightQuery={trimmed} locale={locale} />
                </div>
                <Pagination basePath="/search" filterQueryString={filterQueryString} cursorState={cursorState} nextCursor={nextCursor} locale={locale} />
              </>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

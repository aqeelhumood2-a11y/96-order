import type { PublicProductSummary } from "@/core/storefront/dto";
import { MIN_SEARCH_QUERY_LENGTH } from "@/core/storefront/schemas";
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
}

export function SearchPage({ query, products, nextCursor, cursor, cursorsParam }: SearchPageProps) {
  const trimmed = query.trim();
  const filterQueryString = trimmed ? `q=${encodeURIComponent(trimmed)}` : "";
  const cursorState = parseCursorState(cursor, cursorsParam);

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Search</h1>
      <div className="mt-4 max-w-lg">
        <SearchInput initialQuery={query} />
      </div>

      <div className="mt-8">
        {trimmed.length === 0 && (
          <EmptyState title="Start typing to search" description="Search by product name, brand, category, or tag." />
        )}

        {trimmed.length > 0 && trimmed.length < MIN_SEARCH_QUERY_LENGTH && (
          <EmptyState title="Keep typing…" description={`Enter at least ${MIN_SEARCH_QUERY_LENGTH} characters to search.`} />
        )}

        {trimmed.length >= MIN_SEARCH_QUERY_LENGTH && (
          <>
            <p className="text-sm text-foreground/60" role="status">
              {products.length > 0 ? `Results for "${trimmed}"` : `No products matched "${trimmed}"`}
            </p>
            {products.length > 0 && (
              <>
                <div className="mt-4">
                  <ProductGrid products={products} view="grid" highlightQuery={trimmed} />
                </div>
                <Pagination basePath="/search" filterQueryString={filterQueryString} cursorState={cursorState} nextCursor={nextCursor} />
              </>
            )}
          </>
        )}
      </div>
    </Container>
  );
}

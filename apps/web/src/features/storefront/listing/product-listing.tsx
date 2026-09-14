import type { PublicBrand, PublicCategory, PublicProductSummary } from "@/core/storefront/dto";
import type { ParsedListProductsQuery } from "@/core/storefront/schemas";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { FilterPanel } from "./filter-panel";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { ViewToggle } from "./view-toggle";
import { ProductGrid } from "./product-grid";
import { Pagination } from "./pagination";
import { buildFilterQueryString, parseCursorState } from "./query-utils";

export interface ProductListingProps {
  basePath: string;
  heading: string;
  description?: string;
  query: ParsedListProductsQuery;
  products: PublicProductSummary[];
  nextCursor: string | null;
  cursorsParam?: string;
  view: "grid" | "list";
  categories?: PublicCategory[];
  brands?: PublicBrand[];
  locale?: Locale;
}

export function ProductListing({
  basePath,
  heading,
  description,
  query,
  products,
  nextCursor,
  cursorsParam,
  view,
  categories,
  brands,
  locale = DEFAULT_LOCALE,
}: ProductListingProps) {
  const filterQueryString = buildFilterQueryString(query);
  const cursorState = parseCursorState(query.cursor, cursorsParam);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
      <aside className="hidden w-64 shrink-0 md:block">
        <FilterPanel basePath={basePath} query={query} categories={categories} brands={brands} locale={locale} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-brand-950">{heading}</h1>
            {description && <p className="mt-1 text-sm text-foreground/69">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <MobileFilterDrawer locale={locale}>
              <FilterPanel basePath={basePath} query={query} categories={categories} brands={brands} locale={locale} />
            </MobileFilterDrawer>
            <ViewToggle basePath={basePath} filterQueryString={filterQueryString} cursorState={cursorState} view={view} locale={locale} />
          </div>
        </div>

        <div className="mt-6">
          <ProductGrid products={products} view={view} locale={locale} />
        </div>

        <Pagination basePath={basePath} filterQueryString={filterQueryString} cursorState={cursorState} nextCursor={nextCursor} locale={locale} />
      </div>
    </div>
  );
}

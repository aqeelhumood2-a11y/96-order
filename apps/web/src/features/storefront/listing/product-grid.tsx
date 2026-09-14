import type { PublicProductSummary } from "@/core/storefront/dto";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { ProductCard } from "@/features/storefront/shared/product-card";
import { ProductListRow } from "./product-list-row";
import { EmptyState } from "@/features/storefront/shared/empty-state";

export interface ProductGridProps {
  products: PublicProductSummary[];
  view: "grid" | "list";
  /** Passed through to each card so search-result matches can be visually highlighted; unused by plain listing pages. */
  highlightQuery?: string;
  locale?: Locale;
}

export function ProductGrid({ products, view, highlightQuery, locale = DEFAULT_LOCALE }: ProductGridProps) {
  const dict = getDictionary(locale).storefront.listing;

  if (products.length === 0) {
    return <EmptyState title={dict.noProductsTitle} description={dict.noProductsDescription} />;
  }

  if (view === "list") {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductListRow key={product.id} product={product} locale={locale} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} highlightQuery={highlightQuery} locale={locale} />
      ))}
    </div>
  );
}

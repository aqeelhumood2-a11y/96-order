import Link from "next/link";
import type { PublicProductSummary } from "@/core/storefront/dto";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Container } from "@/ui/layout/container";
import { ProductCard } from "@/features/storefront/shared/product-card";

export interface ProductSectionProps {
  title: string;
  description?: string;
  viewAllHref: string;
  products: PublicProductSummary[];
  locale?: Locale;
}

/** Renders nothing when there's no data — an empty catalog section shouldn't show an empty shelf. */
export function ProductSection({ title, description, viewAllHref, products, locale = DEFAULT_LOCALE }: ProductSectionProps) {
  const dict = getDictionary(locale).storefront.home;
  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-brand-950">{title}</h2>
            {description && <p className="mt-1 text-sm text-foreground/69">{description}</p>}
          </div>
          <Link href={viewAllHref} className="whitespace-nowrap text-sm font-medium text-brand-700 hover:text-brand-900 hover:underline">
            {dict.viewAll}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
}

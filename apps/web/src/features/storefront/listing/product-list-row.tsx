import Link from "next/link";
import type { PublicProductSummary } from "@/core/storefront/dto";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { ProductImage } from "@/features/storefront/shared/product-image";
import { PriceDisplay } from "@/features/storefront/shared/price-display";
import { AvailabilityBadge } from "@/features/storefront/shared/availability-badge";

export function ProductListRow({ product, locale = DEFAULT_LOCALE }: { product: PublicProductSummary; locale?: Locale }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex gap-4 rounded-xl border border-brand-100 bg-background p-3 transition-all duration-200 hover:border-brand-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-md bg-brand-50 sm:w-32">
        <ProductImage src={product.primaryImage?.url} alt={product.primaryImage?.altText ?? product.name} sizes="128px" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1">
        {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-foreground/65">{product.brand.name}</span>}
        <span className="font-medium text-brand-950 group-hover:underline">{product.name}</span>
        {product.shortDescription && <p className="line-clamp-2 text-sm text-foreground/69">{product.shortDescription}</p>}
        <div className="mt-1 flex items-center gap-3">
          <PriceDisplay price={product.displayPrice} compareAtPrice={product.compareAtPrice} locale={locale} />
          <AvailabilityBadge availability={product.availability} locale={locale} />
        </div>
      </div>
    </Link>
  );
}

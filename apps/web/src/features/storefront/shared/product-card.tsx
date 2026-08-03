import Link from "next/link";
import type { PublicProductSummary } from "@/core/storefront/dto";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { ProductImage } from "./product-image";
import { PriceDisplay } from "./price-display";
import { AvailabilityBadge } from "./availability-badge";
import { HighlightText } from "./highlight-text";

export interface ProductCardProps {
  product: PublicProductSummary;
  /** When set, matching words in the product name are wrapped in `<mark>` — used by search results only. */
  highlightQuery?: string;
}

export function ProductCard({ product, highlightQuery }: ProductCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-brand-100 bg-background transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-brand-500">
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10 focus:outline-none" aria-label={product.name} />
      <div className="relative aspect-square w-full bg-brand-50">
        <ProductImage
          src={product.primaryImage?.url}
          alt={product.primaryImage?.altText ?? product.name}
          sizes="(min-width: 1024px) 25vw, 50vw"
        />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded-full bg-accent-600 px-2 py-0.5 text-xs font-medium text-white">Featured</span>
        )}
        <WishlistButton productId={product.id} variantId={null} className="absolute right-2 top-2 z-20" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brand && <span className="text-xs font-medium uppercase tracking-wide text-foreground/65">{product.brand.name}</span>}
        <span className="line-clamp-2 font-medium text-brand-950 group-hover:underline">
          <HighlightText text={product.name} query={highlightQuery} />
        </span>
        <div className="mt-auto flex items-center justify-between pt-2">
          <PriceDisplay price={product.displayPrice} compareAtPrice={product.compareAtPrice} />
          <AvailabilityBadge availability={product.availability} />
        </div>
      </div>
    </div>
  );
}

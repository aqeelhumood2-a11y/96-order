import type { PublicProduct, PublicProductSummary } from "@/core/storefront/dto";
import type { Review } from "@/core/reviews/entities";
import type { ProductQuestion } from "@/core/questions/entities";
import { QuestionsSection } from "@/features/questions/components/questions-section";
import { Container } from "@/ui/layout/container";
import { Badge } from "@/ui/primitives";
import { Breadcrumbs } from "@/features/storefront/shared/breadcrumbs";
import { PriceDisplay } from "@/features/storefront/shared/price-display";
import { AvailabilityBadge } from "@/features/storefront/shared/availability-badge";
import { ProductCard } from "@/features/storefront/shared/product-card";
import { StructuredData } from "@/features/storefront/shared/structured-data";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { BackInStockSubscribeForm } from "@/features/back-in-stock/components/subscribe-form";
import { ReviewsSection } from "@/features/reviews/components/reviews-section";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";
import { AttributesTable } from "./attributes-table";
import { resolveVariantSelection } from "./resolve-variant-selection";

export interface ProductDetailProps {
  product: PublicProduct;
  /** Raw, unvalidated attribute selections straight from the URL's query string. */
  rawSelections: Record<string, string>;
  relatedProducts: PublicProductSummary[];
  structuredData?: Record<string, unknown>[];
  signedInEmail?: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  myReview: Review | null;
  signedInAsCustomer: boolean;
  questions: ProductQuestion[];
}

export function ProductDetail({
  product,
  rawSelections,
  relatedProducts,
  structuredData,
  signedInEmail,
  reviews,
  averageRating,
  reviewCount,
  myReview,
  signedInAsCustomer,
  questions,
}: ProductDetailProps) {
  const { attributeNames, selections, matchedVariant } = resolveVariantSelection(product.variants, rawSelections);

  const price = matchedVariant?.price ?? product.basePrice;
  const compareAtPrice = matchedVariant?.compareAtPrice ?? product.compareAtPrice;
  const availability = product.hasVariants ? (matchedVariant?.availability ?? { inStock: false, lowStock: false }) : product.availability;
  const sku = matchedVariant?.sku ?? product.sku;
  const weightGrams = matchedVariant?.weightGrams ?? product.weightGrams;
  const purchaseAvailable = product.hasVariants ? matchedVariant !== null && availability.inStock : availability.inStock;

  const basePath = `/products/${product.slug}`;

  return (
    <Container className="py-8 sm:py-12">
      {structuredData?.map((data, index) => <StructuredData key={index} data={data} />)}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.primaryCategory.name, href: `/categories/${product.primaryCategory.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && <p className="text-sm font-medium uppercase tracking-wide text-foreground/50">{product.brand.name}</p>}
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-brand-950">{product.name}</h1>
            {product.shortDescription && <p className="mt-2 text-base text-foreground/70">{product.shortDescription}</p>}
          </div>

          <div className="flex items-center gap-3">
            <PriceDisplay price={price} compareAtPrice={compareAtPrice} className="text-lg" />
            <AvailabilityBadge availability={availability} />
          </div>

          <p className="text-sm text-foreground/50">
            SKU: <span className="font-medium text-foreground/70">{sku}</span>
          </p>

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {product.hasVariants && (
            <VariantSelector basePath={basePath} variants={product.variants} attributeNames={attributeNames} selections={selections} />
          )}

          <div className="flex items-start gap-3">
            <AddToCartButton
              productId={product.id}
              variantId={matchedVariant?.id ?? null}
              disabled={!purchaseAvailable}
              disabledReason={product.hasVariants && !matchedVariant ? "Select an available option to continue." : !availability.inStock ? "Out of stock." : undefined}
            />
            <WishlistButton productId={product.id} variantId={matchedVariant?.id ?? null} />
          </div>

          {!purchaseAvailable && (!product.hasVariants || matchedVariant !== null) && (
            <BackInStockSubscribeForm productId={product.id} variantId={matchedVariant?.id ?? null} signedInEmail={signedInEmail} />
          )}

          <AttributesTable coffee={product.attributes?.coffee} equipment={product.attributes?.equipment} weightGrams={weightGrams} dimensions={product.dimensions} />

          {product.fullDescription && (
            <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/80">{product.fullDescription}</div>
          )}
        </div>
      </div>

      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
        myReview={myReview}
        signedIn={signedInAsCustomer}
      />

      <QuestionsSection productId={product.id} productSlug={product.slug} questions={questions} signedIn={signedInAsCustomer} />

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-brand-950">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

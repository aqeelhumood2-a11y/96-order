import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/storefront/get-product";
import { listRelatedProducts } from "@/services/storefront/list-related-products";
import { buildProductMetadata, absoluteUrl } from "@/services/storefront/seo";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/core/storefront/structured-data";
import { ProductDetail } from "@/features/storefront/detail/product-detail";
import { firstValue } from "@/features/storefront/listing/parse-search-params";
import { getCustomerSession } from "@/services/customer-auth/session";
import { listProductReviews } from "@/services/reviews/list-product-reviews";
import { getMyReviewForProduct } from "@/services/reviews/get-my-review";
import { listProductQuestions } from "@/services/questions/list-questions";

const RELATED_PRODUCTS_LIMIT = 8;
const REVIEWS_PAGE_LIMIT = 20;
const QUESTIONS_PAGE_LIMIT = 20;

/** See `app/(storefront)/page.tsx`'s doc comment — this page reads Firestore, so it can't be statically prerendered at build time. */
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const rawSearchParams = await searchParams;
  const rawSelections: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawSearchParams)) {
    const single = firstValue(value);
    if (single !== undefined) rawSelections[key] = single;
  }

  const relatedProducts = await listRelatedProducts(product, RELATED_PRODUCTS_LIMIT);
  const session = await getCustomerSession();
  const reviewsView = await listProductReviews(product.id, { limit: REVIEWS_PAGE_LIMIT });
  const myReview = session ? await getMyReviewForProduct(session, product.id) : null;
  const questionsPage = await listProductQuestions(product.id, { limit: QUESTIONS_PAGE_LIMIT });

  const canonicalUrl = absoluteUrl(`/products/${product.slug}`);
  const structuredData = [
    buildProductJsonLd(product, canonicalUrl),
    buildBreadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: product.primaryCategory.name, url: absoluteUrl(`/categories/${product.primaryCategory.slug}`) },
      { name: product.name, url: canonicalUrl },
    ]),
  ];

  return (
    <ProductDetail
      product={product}
      rawSelections={rawSelections}
      relatedProducts={relatedProducts}
      structuredData={structuredData}
      signedInEmail={session?.email}
      reviews={reviewsView.reviews.items}
      averageRating={reviewsView.averageRating}
      reviewCount={reviewsView.reviewCount}
      myReview={myReview}
      signedInAsCustomer={session !== null}
      questions={questionsPage.items}
    />
  );
}

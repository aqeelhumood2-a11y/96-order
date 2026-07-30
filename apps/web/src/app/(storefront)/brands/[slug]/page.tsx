import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrandBySlug } from "@/services/storefront/get-brand";
import { listActiveCategories } from "@/services/storefront/get-category";
import { listProducts } from "@/services/storefront/list-products";
import { buildBrandMetadata } from "@/services/storefront/seo";
import { ProductListing } from "@/features/storefront/listing/product-listing";
import { firstValue, parseListingSearchParams, parseView } from "@/features/storefront/listing/parse-search-params";

const FILTER_OPTION_LIMIT = 100;

/** See `app/(storefront)/page.tsx`'s doc comment — this page reads Firestore, so it can't be statically prerendered at build time. */
export const dynamic = "force-dynamic";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return buildBrandMetadata(brand);
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const raw = await searchParams;
  const parsed = parseListingSearchParams(raw);
  const query = { ...parsed, brand: brand.slug };
  const view = parseView(raw);

  const [{ items, nextCursor }, categories] = await Promise.all([listProducts(query), listActiveCategories(FILTER_OPTION_LIMIT)]);

  return (
    <ProductListing
      basePath={`/brands/${brand.slug}`}
      heading={brand.name}
      description={brand.description}
      query={query}
      products={items}
      nextCursor={nextCursor}
      cursorsParam={firstValue(raw.cursors)}
      view={view}
      categories={categories}
    />
  );
}

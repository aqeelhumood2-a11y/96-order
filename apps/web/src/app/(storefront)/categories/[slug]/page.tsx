import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/services/storefront/get-category";
import { listActiveBrands } from "@/services/storefront/get-brand";
import { listProducts } from "@/services/storefront/list-products";
import { buildCategoryMetadata } from "@/services/storefront/seo";
import { ProductListing } from "@/features/storefront/listing/product-listing";
import { firstValue, parseListingSearchParams, parseView } from "@/features/storefront/listing/parse-search-params";

const FILTER_OPTION_LIMIT = 100;

/** See `app/(storefront)/page.tsx`'s doc comment — this page reads Firestore, so it can't be statically prerendered at build time. */
export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const raw = await searchParams;
  const parsed = parseListingSearchParams(raw);
  const query = { ...parsed, category: category.slug };
  const view = parseView(raw);

  const [{ items, nextCursor }, brands] = await Promise.all([listProducts(query), listActiveBrands(FILTER_OPTION_LIMIT)]);

  return (
    <ProductListing
      basePath={`/categories/${category.slug}`}
      heading={category.name}
      description={category.description}
      query={query}
      products={items}
      nextCursor={nextCursor}
      cursorsParam={firstValue(raw.cursors)}
      view={view}
      brands={brands}
    />
  );
}

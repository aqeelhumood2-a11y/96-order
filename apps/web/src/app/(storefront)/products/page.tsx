import type { Metadata } from "next";
import { listProducts } from "@/services/storefront/list-products";
import { listActiveCategories } from "@/services/storefront/get-category";
import { listActiveBrands } from "@/services/storefront/get-brand";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { ProductListing } from "@/features/storefront/listing/product-listing";
import { firstValue, parseListingSearchParams, parseView } from "@/features/storefront/listing/parse-search-params";

export const metadata: Metadata = buildStaticPageMetadata(
  "Shop all products",
  "Browse our full catalog of coffee and brewing equipment.",
  "/products",
);

/** See `app/(storefront)/page.tsx`'s doc comment — this page reads Firestore, so it can't be statically prerendered at build time. */
export const dynamic = "force-dynamic";

const FILTER_OPTION_LIMIT = 100;

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const raw = await searchParams;
  const query = parseListingSearchParams(raw);
  const view = parseView(raw);

  const [{ items, nextCursor }, categories, brands] = await Promise.all([
    listProducts(query),
    listActiveCategories(FILTER_OPTION_LIMIT),
    listActiveBrands(FILTER_OPTION_LIMIT),
  ]);

  return (
    <ProductListing
      basePath="/products"
      heading="Shop all products"
      query={query}
      products={items}
      nextCursor={nextCursor}
      cursorsParam={firstValue(raw.cursors)}
      view={view}
      categories={categories}
      brands={brands}
    />
  );
}

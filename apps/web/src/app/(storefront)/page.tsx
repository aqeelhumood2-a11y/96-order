import type { Metadata } from "next";
import { HomePage } from "@/features/storefront/home/home-page";
import { listFeaturedProducts } from "@/services/storefront/list-featured";
import { listNewArrivals } from "@/services/storefront/list-new-arrivals";
import { listProducts } from "@/services/storefront/list-products";
import { listActiveCategories } from "@/services/storefront/get-category";
import { listActiveBrands } from "@/services/storefront/get-brand";
import { buildStaticPageMetadata } from "@/services/storefront/seo";

export const metadata: Metadata = buildStaticPageMetadata(
  "Home",
  "Thoughtfully sourced coffee and brewing equipment.",
  "/",
);

/**
 * Forced dynamic rather than statically prerendered: this page reads
 * Firestore via the Admin SDK, which needs Application Default Credentials
 * that a build step doesn't have (and shouldn't need — catalog data
 * changes independently of deploys). The actual read cost is still
 * bounded by `services/storefront/cache.ts`'s `unstable_cache` wrapping,
 * not by static generation.
 */
export const dynamic = "force-dynamic";

const HOMEPAGE_SECTION_LIMIT = 8;
const HOMEPAGE_CATEGORY_LIMIT = 8;
const HOMEPAGE_BRAND_LIMIT = 12;

export default async function Home() {
  const [featuredCategories, featuredProducts, newArrivals, coffeeProducts, equipmentProducts, featuredBrands] = await Promise.all([
    listActiveCategories(HOMEPAGE_CATEGORY_LIMIT),
    listFeaturedProducts(HOMEPAGE_SECTION_LIMIT),
    listNewArrivals(HOMEPAGE_SECTION_LIMIT),
    listProducts({ productType: "coffee", sort: "newest", limit: HOMEPAGE_SECTION_LIMIT }).then((page) => page.items),
    listProducts({ productType: "equipment", sort: "newest", limit: HOMEPAGE_SECTION_LIMIT }).then((page) => page.items),
    listActiveBrands(HOMEPAGE_BRAND_LIMIT),
  ]);

  return (
    <HomePage
      featuredCategories={featuredCategories}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals}
      coffeeProducts={coffeeProducts}
      equipmentProducts={equipmentProducts}
      featuredBrands={featuredBrands}
    />
  );
}

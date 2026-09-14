import type { Metadata } from "next";
import { HomePage } from "@/features/storefront/home/home-page";
import { listFeaturedProducts } from "@/services/storefront/list-featured";
import { listNewArrivals } from "@/services/storefront/list-new-arrivals";
import { listProducts } from "@/services/storefront/list-products";
import { listActiveBrands } from "@/services/storefront/get-brand";
import { listActiveCategories } from "@/services/storefront/get-category";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { getPublicSiteSettings } from "@/services/site-settings/get-public-settings";
import { getLocale } from "@/lib/i18n/locale";

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
const HOMEPAGE_BRAND_LIMIT = 12;
// Matches `(storefront)/layout.tsx`'s NAV_CATEGORY_LIMIT — same "Browse"
// intent (a manageable, non-scrolling set of top-level categories), just a
// separate query since a page can't read its layout's already-fetched data.
const HOMEPAGE_CATEGORY_LIMIT = 20;

export default async function Home() {
  const [settings, featuredProducts, newArrivals, coffeeProducts, equipmentProducts, featuredBrands, categories, locale] = await Promise.all([
    getPublicSiteSettings(),
    listFeaturedProducts(HOMEPAGE_SECTION_LIMIT),
    listNewArrivals(HOMEPAGE_SECTION_LIMIT),
    listProducts({ productType: "coffee", sort: "newest", limit: HOMEPAGE_SECTION_LIMIT }).then((page) => page.items),
    listProducts({ productType: "equipment", sort: "newest", limit: HOMEPAGE_SECTION_LIMIT }).then((page) => page.items),
    listActiveBrands(HOMEPAGE_BRAND_LIMIT),
    listActiveCategories(HOMEPAGE_CATEGORY_LIMIT),
    getLocale(),
  ]);

  const categoryLinks = categories
    .filter((category) => category.parent === null)
    .map((category) => ({ href: `/categories/${category.slug}`, label: category.name }));

  return (
    <HomePage
      sections={settings.homepageSections}
      featuredProducts={featuredProducts}
      newArrivals={newArrivals}
      coffeeProducts={coffeeProducts}
      equipmentProducts={equipmentProducts}
      featuredBrands={featuredBrands}
      categoryLinks={categoryLinks}
      locale={locale}
    />
  );
}

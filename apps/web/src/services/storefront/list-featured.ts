import type { PublicProductSummary } from "@/core/storefront/dto";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

async function listFeaturedProductsUncached(limit: number, deps: StorefrontDeps): Promise<PublicProductSummary[]> {
  return deps.products.listFeatured(limit);
}

const cachedListFeaturedProducts = withStorefrontCache(
  "storefront:list-featured-products",
  [STOREFRONT_CACHE_TAGS.products],
  (limit: number) => listFeaturedProductsUncached(limit, defaultStorefrontDeps),
);

export async function listFeaturedProducts(limit: number, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicProductSummary[]> {
  if (deps === defaultStorefrontDeps) {
    return cachedListFeaturedProducts(limit);
  }
  return listFeaturedProductsUncached(limit, deps);
}

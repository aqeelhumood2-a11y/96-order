import type { PublicProductSummary } from "@/core/storefront/dto";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

async function listNewArrivalsUncached(limit: number, deps: StorefrontDeps): Promise<PublicProductSummary[]> {
  return deps.products.listNewArrivals(limit);
}

const cachedListNewArrivals = withStorefrontCache("storefront:list-new-arrivals", [STOREFRONT_CACHE_TAGS.products], (limit: number) =>
  listNewArrivalsUncached(limit, defaultStorefrontDeps),
);

export async function listNewArrivals(limit: number, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicProductSummary[]> {
  if (deps === defaultStorefrontDeps) {
    return cachedListNewArrivals(limit);
  }
  return listNewArrivalsUncached(limit, deps);
}

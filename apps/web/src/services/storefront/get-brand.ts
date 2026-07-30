import type { PublicBrand } from "@/core/storefront/dto";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

async function getBrandBySlugUncached(slug: string, deps: StorefrontDeps): Promise<PublicBrand | null> {
  return deps.brands.findBySlug(slug);
}

const cachedGetBrandBySlug = withStorefrontCache("storefront:get-brand", [STOREFRONT_CACHE_TAGS.brands], (slug: string) =>
  getBrandBySlugUncached(slug, defaultStorefrontDeps),
);

/** `null` for an unknown or inactive brand slug — same non-distinguishing shape as `getProductBySlug`. */
export async function getBrandBySlug(slug: string, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicBrand | null> {
  if (deps === defaultStorefrontDeps) {
    return cachedGetBrandBySlug(slug);
  }
  return getBrandBySlugUncached(slug, deps);
}

async function listActiveBrandsUncached(limit: number, deps: StorefrontDeps): Promise<PublicBrand[]> {
  return deps.brands.listActive(limit);
}

const cachedListActiveBrands = withStorefrontCache("storefront:list-active-brands", [STOREFRONT_CACHE_TAGS.brands], (limit: number) =>
  listActiveBrandsUncached(limit, defaultStorefrontDeps),
);

export async function listActiveBrands(limit: number, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicBrand[]> {
  if (deps === defaultStorefrontDeps) {
    return cachedListActiveBrands(limit);
  }
  return listActiveBrandsUncached(limit, deps);
}

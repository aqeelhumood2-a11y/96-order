import type { PublicCategory } from "@/core/storefront/dto";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

async function getCategoryBySlugUncached(slug: string, deps: StorefrontDeps): Promise<PublicCategory | null> {
  return deps.categories.findBySlug(slug);
}

const cachedGetCategoryBySlug = withStorefrontCache("storefront:get-category", [STOREFRONT_CACHE_TAGS.categories], (slug: string) =>
  getCategoryBySlugUncached(slug, defaultStorefrontDeps),
);

/** `null` for an unknown or inactive category slug — same non-distinguishing shape as `getProductBySlug`. */
export async function getCategoryBySlug(slug: string, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicCategory | null> {
  if (deps === defaultStorefrontDeps) {
    return cachedGetCategoryBySlug(slug);
  }
  return getCategoryBySlugUncached(slug, deps);
}

async function listActiveCategoriesUncached(limit: number, deps: StorefrontDeps): Promise<PublicCategory[]> {
  return deps.categories.listActive(limit);
}

const cachedListActiveCategories = withStorefrontCache(
  "storefront:list-active-categories",
  [STOREFRONT_CACHE_TAGS.categories],
  (limit: number) => listActiveCategoriesUncached(limit, defaultStorefrontDeps),
);

export async function listActiveCategories(limit: number, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicCategory[]> {
  if (deps === defaultStorefrontDeps) {
    return cachedListActiveCategories(limit);
  }
  return listActiveCategoriesUncached(limit, deps);
}

import type { PublicProduct } from "@/core/storefront/dto";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

async function getProductBySlugUncached(slug: string, deps: StorefrontDeps): Promise<PublicProduct | null> {
  return deps.products.findBySlug(slug);
}

const cachedGetProductBySlug = withStorefrontCache(
  "storefront:get-product",
  [STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.categories, STOREFRONT_CACHE_TAGS.brands],
  (slug: string) => getProductBySlugUncached(slug, defaultStorefrontDeps),
);

/**
 * Returns `null` for a slug that doesn't exist, isn't `active`/`visible`,
 * or never existed — deliberately the same `null` for all three, so a
 * caller (and the 404 page it renders) can't distinguish "never existed"
 * from "exists but is a draft" from external behavior alone. This is what
 * prevents unpublished-slug enumeration: probing slugs gets an identical
 * 404 either way.
 */
export async function getProductBySlug(slug: string, deps: StorefrontDeps = defaultStorefrontDeps): Promise<PublicProduct | null> {
  if (deps === defaultStorefrontDeps) {
    return cachedGetProductBySlug(slug);
  }
  return getProductBySlugUncached(slug, deps);
}

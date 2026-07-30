import type { PublicProduct, PublicProductSummary } from "@/core/storefront/dto";
import { selectRelatedProducts } from "@/core/storefront/rules";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

/**
 * "Related" means "same primary category" — the simplest rule that's
 * always meaningful for a foundation phase with no purchase-history or
 * co-viewed-product data yet. See README's Known limitations for richer
 * relatedness signals left for later.
 */
async function listRelatedProductsUncached(
  productId: string,
  categorySlug: string,
  limit: number,
  deps: StorefrontDeps,
): Promise<PublicProductSummary[]> {
  const category = await deps.categories.findBySlug(categorySlug);
  if (!category) return [];

  const candidates = await deps.products.listByCategoryId(category.id, productId, limit + 1);
  return selectRelatedProducts(candidates, productId, limit);
}

const cachedListRelatedProducts = withStorefrontCache(
  "storefront:list-related-products",
  [STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.categories],
  (productId: string, categorySlug: string, limit: number) =>
    listRelatedProductsUncached(productId, categorySlug, limit, defaultStorefrontDeps),
);

export async function listRelatedProducts(
  product: Pick<PublicProduct, "id" | "primaryCategory">,
  limit: number,
  deps: StorefrontDeps = defaultStorefrontDeps,
): Promise<PublicProductSummary[]> {
  if (deps === defaultStorefrontDeps) {
    return cachedListRelatedProducts(product.id, product.primaryCategory.slug, limit);
  }
  return listRelatedProductsUncached(product.id, product.primaryCategory.slug, limit, deps);
}

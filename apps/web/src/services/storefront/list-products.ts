import type { Page } from "@/core/interfaces/repository";
import type { PublicProductSummary } from "@/core/storefront/dto";
import { isWithinPriceRange, matchesAvailabilityFilter } from "@/core/storefront/rules";
import type { ParsedListProductsQuery } from "@/core/storefront/schemas";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

/**
 * Availability is cached alongside the rest of the product data (same
 * 5-minute window as everything else in this file) rather than fetched
 * fresh on every request — a deliberate tradeoff, not an oversight. This
 * is purely a storefront *display* signal; nothing here reserves or
 * mutates stock (see README's Variant selection section), so a few
 * minutes of staleness on "in stock" text is an accepted cost, the same
 * one most storefronts accept for a cached listing page. A future
 * checkout flow would need its own fresh availability check at the
 * moment of purchase, not this cached read.
 */
async function listProductsUncached(query: ParsedListProductsQuery, deps: StorefrontDeps): Promise<Page<PublicProductSummary>> {
  const [categoryRef, brandRef] = await Promise.all([
    query.category ? deps.categories.findBySlug(query.category) : Promise.resolve(null),
    query.brand ? deps.brands.findBySlug(query.brand) : Promise.resolve(null),
  ]);

  // An unknown or inactive category/brand slug means "no results", not an
  // error — the same way any other filter that happens to match nothing
  // behaves. This also means a hidden/inactive category's slug can never
  // be used to enumerate its products.
  if ((query.category && !categoryRef) || (query.brand && !brandRef)) {
    return { items: [], nextCursor: null };
  }

  const page = await deps.products.list({
    categoryId: categoryRef?.id,
    brandId: brandRef?.id,
    productType: query.productType,
    featured: query.featured,
    sort: query.sort,
    cursor: query.cursor,
    limit: query.limit,
  });

  // In-memory refinement for every filter dimension that wasn't
  // necessarily the one Firestore-indexed filter — see
  // `PublicProductRepository`'s doc comment. A heavily filtered request
  // can therefore return fewer than `query.limit` items even when more
  // matches exist on the next page; this is documented in the README, not
  // hidden.
  const items = page.items.filter((item) => {
    if (categoryRef && item.primaryCategory.slug !== categoryRef.slug) return false;
    if (brandRef && item.brand?.slug !== brandRef.slug) return false;
    if (query.productType && item.productType !== query.productType) return false;
    if (query.featured !== undefined && item.featured !== query.featured) return false;
    if (!isWithinPriceRange(item.displayPrice, query.minPrice, query.maxPrice)) return false;
    if (!matchesAvailabilityFilter(item.availability, query.availability)) return false;
    return true;
  });

  return { items, nextCursor: page.nextCursor };
}

const cachedListProducts = withStorefrontCache(
  "storefront:list-products",
  [STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.categories, STOREFRONT_CACHE_TAGS.brands],
  (query: ParsedListProductsQuery) => listProductsUncached(query, defaultStorefrontDeps),
);

export async function listProducts(
  query: ParsedListProductsQuery,
  deps: StorefrontDeps = defaultStorefrontDeps,
): Promise<Page<PublicProductSummary>> {
  if (deps === defaultStorefrontDeps) {
    return cachedListProducts(query);
  }
  return listProductsUncached(query, deps);
}

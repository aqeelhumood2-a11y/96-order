import { matchesAllQueryWords, tokenizeQuery } from "@/core/catalog/rules";
import type { Page } from "@/core/interfaces/repository";
import type { PublicProductSummary } from "@/core/storefront/dto";
import type { ParsedSearchQuery } from "@/core/storefront/schemas";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "./cache";
import { defaultStorefrontDeps, type StorefrontDeps } from "./dependencies";

/**
 * See README's Search strategy section for the full design. Short version:
 * the *longest* query word (most selective, smallest candidate set) is the
 * one Firestore-indexed `array-contains` filter; every other word is
 * checked in-memory against that same bounded page only — never a second
 * Firestore query, never an unbounded scan. This means a multi-word query
 * can return fewer than `query.limit` results even when more exist on the
 * next page, the same documented tradeoff `list-products.ts` has for its
 * own in-memory-refined filters.
 */
async function searchProductsUncached(query: ParsedSearchQuery, deps: StorefrontDeps): Promise<Page<PublicProductSummary>> {
  const words = tokenizeQuery(query.q);
  if (words.length === 0) {
    return { items: [], nextCursor: null };
  }

  const [primaryWord] = [...words].sort((a, b) => b.length - a.length);
  const page = await deps.products.searchByToken(primaryWord!, query.cursor, query.limit);

  const remainingWords = words.filter((word) => word !== primaryWord);
  const items =
    remainingWords.length === 0
      ? page.items
      : page.items.filter((item) =>
          matchesAllQueryWords(
            [item.name, item.productType, item.brand?.name ?? "", item.primaryCategory.name, ...item.tags],
            remainingWords,
          ),
        );

  return { items, nextCursor: page.nextCursor };
}

const cachedSearchProducts = withStorefrontCache(
  "storefront:search-products",
  [STOREFRONT_CACHE_TAGS.products, STOREFRONT_CACHE_TAGS.categories, STOREFRONT_CACHE_TAGS.brands],
  (query: ParsedSearchQuery) => searchProductsUncached(query, defaultStorefrontDeps),
);

export async function searchProducts(
  query: ParsedSearchQuery,
  deps: StorefrontDeps = defaultStorefrontDeps,
): Promise<Page<PublicProductSummary>> {
  if (deps === defaultStorefrontDeps) {
    return cachedSearchProducts(query);
  }
  return searchProductsUncached(query, deps);
}

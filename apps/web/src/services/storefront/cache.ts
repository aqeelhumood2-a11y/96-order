import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Coarse, entity-kind-level tags — not per-slug. `revalidateTag("storefront:products")`
 * invalidates every cached product list *and* every cached product-detail
 * page together, rather than surgically invalidating just the one product
 * that changed. This is a deliberate simplification for Phase 4's expected
 * scale (`unstable_cache`'s `tags` option is a static list per wrapped
 * function, not a function of its arguments, so per-slug tags would need a
 * freshly-constructed wrapped function per slug — more machinery than this
 * phase's traffic justifies). See README's Cache strategy section.
 */
export const STOREFRONT_CACHE_TAGS = {
  products: "storefront:products",
  categories: "storefront:categories",
  brands: "storefront:brands",
  siteSettings: "storefront:site-settings",
} as const;

/**
 * Safety-net revalidation even if an admin mutation's explicit
 * `revalidateTag()` call is ever missed — nothing served from this cache
 * is more than this many seconds stale from Firestore's actual state,
 * including a product's own availability (see the doc comment on
 * `services/storefront/list-products.ts` for why availability is cached
 * alongside the rest of the product data rather than fetched fresh).
 */
export const STOREFRONT_CACHE_REVALIDATE_SECONDS = 300;

/**
 * Wraps a storefront read for production use. `unstable_cache` requires
 * its wrapped function's arguments to be JSON-serializable (they become
 * part of the cache key) — this is why every `services/storefront/*`
 * function takes only plain, serializable query objects, never a `deps`
 * object, as the argument to the *cached* function; each service's
 * exported entry point decides whether to call the cached wrapper (default
 * deps, i.e. real Firestore) or the plain uncached function directly
 * (injected mock deps, i.e. unit tests) — see any of those files for the
 * exact pattern.
 */
export function withStorefrontCache<Args extends readonly unknown[], T>(
  keyPrefix: string,
  tags: readonly string[],
  fn: (...args: Args) => Promise<T>,
): (...args: Args) => Promise<T> {
  return unstable_cache(fn, [keyPrefix], { tags: [...tags], revalidate: STOREFRONT_CACHE_REVALIDATE_SECONDS });
}

/**
 * Thin wrapper around Next's `revalidateTag` so every admin action call
 * site (under `features/catalog`) doesn't need to know about the required
 * `"max"` profile argument (this Next.js version deprecates the
 * single-argument form) — `"max"` means "invalidate immediately, to the
 * fullest extent", which is what a catalog mutation needs: the next
 * storefront read for that tag should never see stale data, not a
 * stale-while-revalidate window.
 */
export function revalidateStorefrontTag(tag: string): void {
  revalidateTag(tag, "max");
}

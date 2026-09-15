import type { Session } from "@/core/auth/entities";
import { matchesAllQueryWords, tokenizeQuery } from "@/core/catalog/rules";
import type { Product } from "@/core/catalog/entities";
import type { ListProductsRequest } from "@/core/interfaces/product-repository";
import type { Page } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * How many of the most recent (optionally status/category/brand-filtered)
 * products get scanned in-memory for a `search` query. There's no
 * dedicated Firestore composite index for this (unlike the storefront's
 * `searchTokens` + `array-contains` query) — this admin tool runs against
 * one store's own catalog, realistically well under this scan size, so a
 * bounded in-memory match avoids needing a new index deployed. A search
 * therefore returns at most `request.limit` matches from this scan window
 * and never paginates further (`nextCursor` is always `null`).
 */
const SEARCH_SCAN_LIMIT = 500;

export async function listProducts(actor: Session, request: ListProductsRequest, deps: CatalogDeps = defaultCatalogDeps): Promise<Page<Product>> {
  requirePermission(actor, "products:view");

  const words = request.search ? tokenizeQuery(request.search) : [];
  if (words.length === 0) {
    return deps.products.list(request);
  }

  const page = await deps.products.list({
    limit: SEARCH_SCAN_LIMIT,
    status: request.status,
    categoryId: request.categoryId,
    brandId: request.brandId,
  });
  const matches = page.items.filter((product) => matchesAllQueryWords(product.searchTokens, words));
  return { items: matches.slice(0, request.limit), nextCursor: null };
}

export async function getProduct(actor: Session, productId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<Product | null> {
  requirePermission(actor, "products:view");
  return deps.products.findById(productId);
}

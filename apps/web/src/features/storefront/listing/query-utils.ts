import { ACTIVE_CURRENCY } from "@/core/money/money";
import type { ParsedListProductsQuery } from "@/core/storefront/schemas";

/**
 * Rebuilds the canonical filter/sort query string from the already-parsed
 * query — used to build "Next page"/"Previous page"/view-toggle links that
 * preserve every active filter. `minPrice`/`maxPrice` (minor units,
 * matching storage) are converted back to the `minPriceBhd`/`maxPriceBhd`
 * major-unit fields `FilterPanel`'s form actually submits, so the URL stays
 * in one consistent dialect throughout — see `FilterPanel`'s doc comment.
 */
export function buildFilterQueryString(query: ParsedListProductsQuery): string {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.brand) params.set("brand", query.brand);
  if (query.productType) params.set("productType", query.productType);
  if (query.minPrice !== undefined) params.set("minPriceBhd", String(query.minPrice / ACTIVE_CURRENCY.minorUnitsPerMajor));
  if (query.maxPrice !== undefined) params.set("maxPriceBhd", String(query.maxPrice / ACTIVE_CURRENCY.minorUnitsPerMajor));
  if (query.availability && query.availability !== "all") params.set("availability", query.availability);
  if (query.featured !== undefined) params.set("featured", String(query.featured));
  if (query.sort !== "newest") params.set("sort", query.sort);
  return params.toString();
}

export interface CursorState {
  cursor?: string;
  /** Prior page cursors, oldest first — lets "Previous" walk back through cursor-based pagination without numbered pages. */
  history: string[];
}

export function parseCursorState(cursor: string | undefined, cursorsParam: string | undefined): CursorState {
  return {
    cursor,
    history: cursorsParam ? cursorsParam.split(",").filter(Boolean) : [],
  };
}

export function nextPageHref(basePath: string, filterQueryString: string, state: CursorState, nextCursor: string): string {
  const params = new URLSearchParams(filterQueryString);
  const history = state.cursor !== undefined ? [...state.history, state.cursor] : state.history;
  if (history.length > 0) params.set("cursors", history.join(","));
  params.set("cursor", nextCursor);
  return `${basePath}?${params.toString()}`;
}

export function prevPageHref(basePath: string, filterQueryString: string, state: CursorState): string {
  const params = new URLSearchParams(filterQueryString);
  const history = [...state.history];
  const prevCursor = history.pop();
  if (history.length > 0) params.set("cursors", history.join(","));
  if (prevCursor !== undefined) params.set("cursor", prevCursor);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function viewToggleHref(basePath: string, filterQueryString: string, state: CursorState, view: "grid" | "list"): string {
  const params = new URLSearchParams(filterQueryString);
  if (state.cursor !== undefined) params.set("cursor", state.cursor);
  if (state.history.length > 0) params.set("cursors", state.history.join(","));
  if (view === "list") params.set("view", "list");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

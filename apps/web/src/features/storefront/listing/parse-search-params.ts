import { ACTIVE_CURRENCY } from "@/core/money/money";
import { listProductsQuerySchema, type ParsedListProductsQuery } from "@/core/storefront/schemas";

/** Next.js hands page `searchParams` as possibly-repeated values; every filter here is single-valued, so the first occurrence wins. */
export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Converts raw URL search params into a validated `ParsedListProductsQuery`.
 * `minPriceBhd`/`maxPriceBhd` (the major-unit amounts `FilterPanel` submits)
 * are converted to the `minPrice`/`maxPrice` minor-unit (fils) fields the
 * schema (and storage) actually use. Anything that fails validation degrades
 * to "no filters" rather than throwing — a hand-edited or stale query string
 * must never 500 the page.
 */
export function parseListingSearchParams(raw: Record<string, string | string[] | undefined>): ParsedListProductsQuery {
  const minPriceBhd = firstValue(raw.minPriceBhd);
  const maxPriceBhd = firstValue(raw.maxPriceBhd);

  const candidate = {
    category: firstValue(raw.category),
    brand: firstValue(raw.brand),
    productType: firstValue(raw.productType),
    minPrice: minPriceBhd ? Math.round(Number(minPriceBhd) * ACTIVE_CURRENCY.minorUnitsPerMajor) : undefined,
    maxPrice: maxPriceBhd ? Math.round(Number(maxPriceBhd) * ACTIVE_CURRENCY.minorUnitsPerMajor) : undefined,
    availability: firstValue(raw.availability),
    featured: firstValue(raw.featured),
    sort: firstValue(raw.sort),
    cursor: firstValue(raw.cursor),
  };

  const result = listProductsQuerySchema.safeParse(candidate);
  return result.success ? result.data : listProductsQuerySchema.parse({});
}

export function parseView(raw: Record<string, string | string[] | undefined>): "grid" | "list" {
  return firstValue(raw.view) === "list" ? "list" : "grid";
}

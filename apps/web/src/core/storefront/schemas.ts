import { z } from "zod";

export const PRODUCT_SORT_OPTIONS = ["newest", "name", "price_asc", "price_desc"] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

export const AVAILABILITY_FILTERS = ["all", "in_stock"] as const;
export type AvailabilityFilter = (typeof AVAILABILITY_FILTERS)[number];

/**
 * Query-param validation for `/products`, `/categories/[slug]`, and
 * `/brands/[slug]` — every one of these is untrusted user input (a URL
 * anyone can type or share), so it's parsed with Zod before it ever
 * reaches a repository, the same discipline Phase 2/3 applied to
 * request bodies. `cursor` is an opaque Firestore document id, never
 * interpreted or validated beyond "non-empty string" — see README's
 * Filters and pagination section for why this is cursor-based, not
 * page-number-based.
 */
export const listProductsQuerySchema = z.object({
  category: z.string().trim().min(1).max(200).optional(),
  brand: z.string().trim().min(1).max(200).optional(),
  productType: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  availability: z.enum(AVAILABILITY_FILTERS).optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  sort: z.enum(PRODUCT_SORT_OPTIONS).default("newest"),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().positive().max(60).default(24),
});
export type ListProductsQuery = z.input<typeof listProductsQuerySchema>;
export type ParsedListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const MIN_SEARCH_QUERY_LENGTH = 2;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(MIN_SEARCH_QUERY_LENGTH).max(200),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().positive().max(60).default(24),
});
export type SearchQuery = z.input<typeof searchQuerySchema>;
export type ParsedSearchQuery = z.infer<typeof searchQuerySchema>;

export const variantSelectionQuerySchema = z.record(z.string().trim().min(1), z.string().trim().min(1));

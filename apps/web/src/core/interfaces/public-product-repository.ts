import type { PublicProduct, PublicProductSummary } from "@/core/storefront/dto";
import type { ProductSortOption } from "@/core/storefront/schemas";
import type { Page } from "./repository";

/**
 * The Firestore-indexed subset of `/products` query filters — see
 * README's Filters and pagination section for why this port only accepts
 * one equality-filter dimension (category XOR brand XOR productType XOR
 * featured, though featured can combine with the others) at a time rather
 * than every possible combination: each *combination* actually exercised
 * needs its own composite index, so the filter surface is deliberately
 * bounded to keep that index list finite. `minPrice`/`maxPrice`/
 * `availability` are NOT here — those are applied in-memory in
 * `services/storefront/list-products.ts` over the bounded page this
 * returns, never as a native Firestore filter.
 */
export interface PublicProductListFilter {
  categoryId?: string;
  brandId?: string;
  productType?: string;
  featured?: boolean;
  sort: ProductSortOption;
  cursor?: string;
  limit: number;
}

/**
 * Every method here bakes `status == "active"` and `visibility == "visible"`
 * into its own Firestore query — there is no method on this port that can
 * return a draft, archived, or hidden product under any circumstance,
 * including `findBySlug`. This is the public counterpart to
 * `core/interfaces/product-repository.ts`; the two are deliberately
 * separate ports (not one port with a "public mode" flag) so a caller
 * literally cannot request the admin shape from the public path or vice
 * versa.
 */
export interface PublicProductRepository {
  list(filter: PublicProductListFilter): Promise<Page<PublicProductSummary>>;
  findBySlug(slug: string): Promise<PublicProduct | null>;
  listFeatured(limit: number): Promise<PublicProductSummary[]>;
  listNewArrivals(limit: number): Promise<PublicProductSummary[]>;
  listByCategoryId(categoryId: string, excludeProductId: string, limit: number): Promise<PublicProductSummary[]>;
  /**
   * Bounded, indexed candidate fetch for search: queries `searchTokens
   * array-contains primaryToken` (plus the visibility equality filters),
   * cursor-paginated, capped at `limit` — never an unbounded scan.
   * Multi-word refinement against the remaining query words happens in
   * `services/storefront/search-products.ts`, over this same bounded page
   * only, never by re-querying Firestore.
   */
  searchByToken(primaryToken: string, cursor: string | undefined, limit: number): Promise<Page<PublicProductSummary>>;
}

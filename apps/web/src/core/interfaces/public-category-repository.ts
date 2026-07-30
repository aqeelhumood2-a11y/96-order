import type { PublicCategory } from "@/core/storefront/dto";

/** Every method bakes `isActive == true` into its query — an inactive category can never be returned. */
export interface PublicCategoryRepository {
  findBySlug(slug: string): Promise<PublicCategory | null>;
  findById(id: string): Promise<PublicCategory | null>;
  /** Ordered by `sortOrder` — see README for why "featured categories" means "first N active, by sort order" rather than a dedicated admin-curated flag (Category has no `featured` field in Phase 3). */
  listActive(limit?: number): Promise<PublicCategory[]>;
}

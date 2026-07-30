import type { PublicBrand } from "@/core/storefront/dto";

/** Every method bakes `isActive == true` into its query — an inactive brand can never be returned. */
export interface PublicBrandRepository {
  findBySlug(slug: string): Promise<PublicBrand | null>;
  findById(id: string): Promise<PublicBrand | null>;
  /** Ordered by `name` — see `PublicCategoryRepository`'s doc comment for the same "no dedicated featured flag" rationale, which applies identically to Brand. */
  listActive(limit?: number): Promise<PublicBrand[]>;
}

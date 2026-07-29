import type { Product, ProductStatus } from "@/core/catalog/entities";
import type { Page, PageRequest } from "./repository";

export interface ListProductsRequest extends PageRequest {
  status?: ProductStatus;
  categoryId?: string;
  brandId?: string;
}

/**
 * Port for the `products` collection. `create`/`update` are responsible
 * for enforcing slug/SKU/barcode uniqueness (across the whole catalog for
 * SKU/barcode, scoped to products for slug) atomically alongside the
 * document write — the Firestore implementation does this in a single
 * transaction against the `catalogUniqueKeys` collection, throwing
 * `ConflictError` on collision, so callers never see a product persisted
 * with a value that turned out to be a duplicate.
 */
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  list(request: ListProductsRequest): Promise<Page<Product>>;
  /** Throws `ConflictError` if the slug, SKU, or any variant SKU/barcode is already in use. */
  create(product: Product): Promise<void>;
  /**
   * `expectedVersion` must match the document's current `version` field or
   * this throws `ConflictError` — the optimistic-concurrency guard against
   * two admins editing the same product at once. Throws `ConflictError`
   * separately if the patch introduces a slug/SKU/barcode collision.
   */
  update(id: string, patch: Partial<Product>, expectedVersion: number): Promise<void>;
  /** Sets `status: "archived"` — Phase 3's only supported deletion path for products (see README's Deletion policy). */
  archive(id: string, archivedBy: string): Promise<void>;
  countByCategory(categoryId: string): Promise<number>;
  countByBrand(brandId: string): Promise<number>;
}

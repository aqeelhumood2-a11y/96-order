import type { Brand } from "@/core/catalog/entities";
import type { Page, PageRequest } from "./repository";

export interface BrandRepository {
  findById(id: string): Promise<Brand | null>;
  findBySlug(slug: string): Promise<Brand | null>;
  list(request: PageRequest): Promise<Page<Brand>>;
  /** Throws `ConflictError` if the slug is already in use. */
  create(brand: Brand): Promise<void>;
  /** Throws `ConflictError` if the patch introduces a slug collision. */
  update(id: string, patch: Partial<Brand>): Promise<void>;
  delete(id: string): Promise<void>;
}

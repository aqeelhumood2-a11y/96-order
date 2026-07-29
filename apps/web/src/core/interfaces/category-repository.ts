import type { Category } from "@/core/catalog/entities";
import type { Page, PageRequest } from "./repository";

export interface ListCategoriesRequest extends PageRequest {
  parentId?: string | null;
}

/**
 * Port for the `categories` collection. Category trees are admin-curated
 * (not user-generated), so `listAll()` returning the entire collection
 * un-paginated is an intentional, documented simplification — see the
 * README's Firestore model section for the size assumption behind it. It's
 * what backs both the circular-reference check (`core/catalog/rules.ts`)
 * and rendering the full tree in the admin UI.
 */
export interface CategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  list(request: ListCategoriesRequest): Promise<Page<Category>>;
  listAll(): Promise<Category[]>;
  /** Throws `ConflictError` if the slug is already in use. */
  create(category: Category): Promise<void>;
  /** Throws `ConflictError` if the patch introduces a slug collision. */
  update(id: string, patch: Partial<Category>): Promise<void>;
  delete(id: string): Promise<void>;
}

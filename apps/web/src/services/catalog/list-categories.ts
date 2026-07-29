import type { Session } from "@/core/auth/entities";
import type { Category } from "@/core/catalog/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/** Returns the full category tree (unpaginated — see `CategoryRepository.listAll()`'s doc comment for why that's safe here). */
export async function listAllCategories(actor: Session, deps: CatalogDeps = defaultCatalogDeps): Promise<Category[]> {
  requirePermission(actor, "categories:view");
  return deps.categories.listAll();
}

export async function getCategory(actor: Session, categoryId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<Category | null> {
  requirePermission(actor, "categories:view");
  return deps.categories.findById(categoryId);
}

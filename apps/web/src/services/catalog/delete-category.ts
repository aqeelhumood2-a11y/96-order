import type { Session } from "@/core/auth/entities";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * Hard delete — but only ever reachable for a category that is genuinely
 * unused. A category referenced by any product (as its primary or an
 * additional category) or that has child categories cannot be deleted
 * through this use case; per the README's Deletion policy, an in-use
 * category has no delete path at all in Phase 3, validated or otherwise.
 */
export async function deleteCategory(actor: Session, categoryId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<void> {
  requirePermission(actor, "categories:delete");

  const category = await deps.categories.findById(categoryId);
  if (!category) {
    throw new NotFoundError("Category not found.");
  }

  const [productCount, children] = await Promise.all([
    deps.products.countByCategory(categoryId),
    deps.categories.list({ limit: 1, parentId: categoryId }),
  ]);

  if (productCount > 0) {
    throw new ForbiddenError("This category is assigned to one or more products and cannot be deleted.");
  }
  if (children.items.length > 0) {
    throw new ForbiddenError("This category has subcategories and cannot be deleted.");
  }

  await deps.categories.delete(categoryId);
  await deps.auditLogs.record({
    type: "category_deleted",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { categoryId, slug: category.slug },
  });
}

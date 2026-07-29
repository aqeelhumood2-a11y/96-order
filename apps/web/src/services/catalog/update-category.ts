import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import { type UpdateCategoryInput, updateCategorySchema } from "@/core/catalog/schemas";
import { wouldCreateCircularCategoryReference } from "@/core/catalog/rules";
import { NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function updateCategory(
  actor: Session,
  categoryId: string,
  input: UpdateCategoryInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<void> {
  requirePermission(actor, "categories:edit");
  const parsed = updateCategorySchema.parse(input);

  const existing = await deps.categories.findById(categoryId);
  if (!existing) {
    throw new NotFoundError("Category not found.");
  }

  if (parsed.parentId !== undefined && parsed.parentId !== existing.parentId) {
    if (parsed.parentId) {
      const parent = await deps.categories.findById(parsed.parentId);
      if (!parent) {
        throw new ValidationError("Parent category not found.");
      }
    }

    const circular = await wouldCreateCircularCategoryReference(categoryId, parsed.parentId, (id) =>
      deps.categories.findById(id),
    );
    if (circular) {
      throw new ValidationError("This parent would create a circular category reference.");
    }
  }

  // An explicit `slug` in the input wins; otherwise a renamed category gets
  // a freshly derived slug; otherwise the slug is left untouched.
  const slug = parsed.slug ?? (parsed.name !== undefined ? slugify(parsed.name) : undefined);

  await deps.categories.update(categoryId, {
    ...parsed,
    ...(slug !== undefined ? { slug } : {}),
  });

  await deps.auditLogs.record({
    type: "category_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { categoryId, ...parsed },
  });
}

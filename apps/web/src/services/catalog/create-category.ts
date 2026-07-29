import { randomUUID } from "node:crypto";
import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import type { Category } from "@/core/catalog/entities";
import { type CreateCategoryInput, createCategorySchema } from "@/core/catalog/schemas";
import { ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function createCategory(
  actor: Session,
  input: CreateCategoryInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<Category> {
  requirePermission(actor, "categories:create");
  const parsed = createCategorySchema.parse(input);
  const slug = parsed.slug ?? slugify(parsed.name);
  if (!slug) {
    throw new ValidationError("Could not derive a slug from this name — provide one explicitly.");
  }

  if (parsed.parentId) {
    const parent = await deps.categories.findById(parsed.parentId);
    if (!parent) {
      throw new ValidationError("Parent category not found.");
    }
  }

  const now = new Date();
  const category: Category = {
    id: randomUUID(),
    name: parsed.name,
    slug,
    description: parsed.description,
    parentId: parsed.parentId,
    sortOrder: parsed.sortOrder,
    isActive: parsed.isActive,
    imageRef: parsed.imageRef,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };

  await deps.categories.create(category);
  await deps.auditLogs.record({
    type: "category_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { categoryId: category.id, slug },
  });

  return category;
}

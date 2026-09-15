import type { Session } from "@/core/auth/entities";
import { type UpdateBrandInput, updateBrandSchema } from "@/core/catalog/schemas";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";
import { withUniqueSlug } from "./unique-slug";

export async function updateBrand(
  actor: Session,
  brandId: string,
  input: UpdateBrandInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<void> {
  requirePermission(actor, "brands:edit");
  const parsed = updateBrandSchema.parse(input);

  const existing = await deps.brands.findById(brandId);
  if (!existing) {
    throw new NotFoundError("Brand not found.");
  }

  if (parsed.slug === undefined && parsed.name === undefined) {
    await deps.brands.update(brandId, parsed);
  } else {
    await withUniqueSlug(parsed.name ?? existing.name, parsed.slug, (slug) => deps.brands.update(brandId, { ...parsed, slug }));
  }

  await deps.auditLogs.record({
    type: "brand_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { brandId, ...parsed },
  });
}

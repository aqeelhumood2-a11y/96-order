import { slugify } from "@96order/shared";
import type { Session } from "@/core/auth/entities";
import { type UpdateBrandInput, updateBrandSchema } from "@/core/catalog/schemas";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

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

  const slug = parsed.slug ?? (parsed.name !== undefined ? slugify(parsed.name) : undefined);

  await deps.brands.update(brandId, {
    ...parsed,
    ...(slug !== undefined ? { slug } : {}),
  });

  await deps.auditLogs.record({
    type: "brand_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { brandId, ...parsed },
  });
}

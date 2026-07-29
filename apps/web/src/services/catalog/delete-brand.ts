import type { Session } from "@/core/auth/entities";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/** Hard delete, only reachable when unused — see `deleteCategory`'s doc comment for the same policy applied to brands. */
export async function deleteBrand(actor: Session, brandId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<void> {
  requirePermission(actor, "brands:delete");

  const brand = await deps.brands.findById(brandId);
  if (!brand) {
    throw new NotFoundError("Brand not found.");
  }

  const productCount = await deps.products.countByBrand(brandId);
  if (productCount > 0) {
    throw new ForbiddenError("This brand is assigned to one or more products and cannot be deleted.");
  }

  await deps.brands.delete(brandId);
  await deps.auditLogs.record({
    type: "brand_deleted",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { brandId, slug: brand.slug },
  });
}

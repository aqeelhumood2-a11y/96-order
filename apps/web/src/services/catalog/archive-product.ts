import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * Products are never hard-deleted in Phase 3 (see README's Deletion
 * policy) — archiving is the only removal path, gated behind
 * `products:delete` even though it's a status change rather than a
 * document delete, since it's the operation that takes a product out of
 * the active catalog.
 */
export async function archiveProduct(actor: Session, productId: string, deps: CatalogDeps = defaultCatalogDeps): Promise<void> {
  requirePermission(actor, "products:delete");

  const product = await deps.products.findById(productId);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  await deps.products.archive(productId, actor.uid);
  await deps.auditLogs.record({
    type: "product_archived",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId, slug: product.slug },
  });
}

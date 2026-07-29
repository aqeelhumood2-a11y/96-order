import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * Removes the image from the product's metadata first, then deletes the
 * underlying Storage object. That order — not the reverse — means a
 * failure partway through leaves at worst an unreferenced orphan file in
 * the bucket (harmless, nothing points to it), never a product still
 * listing an image whose bytes are already gone.
 */
export async function deleteProductImage(
  actor: Session,
  productId: string,
  imageId: string,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<void> {
  requirePermission(actor, "products:edit");

  const product = await deps.products.findById(productId);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  const target = product.images.find((image) => image.id === imageId);
  if (!target) {
    throw new NotFoundError("Image not found on this product.");
  }

  const remaining = product.images.filter((image) => image.id !== imageId);
  const nextImages =
    target.isPrimary && remaining.length > 0 ? remaining.map((image, index) => (index === 0 ? { ...image, isPrimary: true } : image)) : remaining;

  await deps.products.update(productId, { images: nextImages }, product.version);
  await deps.productImages.delete(target.storagePath).catch(() => undefined);

  await deps.auditLogs.record({
    type: "product_image_deleted",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId, imageId },
  });
}

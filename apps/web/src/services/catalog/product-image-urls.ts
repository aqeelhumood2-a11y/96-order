import type { Session } from "@/core/auth/entities";
import type { Product } from "@/core/catalog/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * Resolves each image's Firebase Storage download-token URL for the admin
 * preview — see `infrastructure/firebase/product-image-storage.ts`'s doc
 * comment for why this is a download token, not a short-lived signed URL.
 */
export async function getProductImageUrls(
  actor: Session,
  product: Product,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<Record<string, string>> {
  requirePermission(actor, "products:view");
  const entries = await Promise.all(
    product.images.map(async (image) => [image.id, await deps.productImages.getDownloadUrl(image.storagePath)] as const),
  );
  return Object.fromEntries(entries);
}

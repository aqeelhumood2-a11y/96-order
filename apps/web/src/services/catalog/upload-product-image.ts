import { randomUUID } from "node:crypto";
import type { Session } from "@/core/auth/entities";
import type { ProductImage } from "@/core/catalog/entities";
import { PRODUCT_IMAGE_MAX_SIZE_BYTES, uploadProductImageSchema } from "@/core/catalog/schemas";
import { NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export interface UploadProductImageParams {
  /**
   * Raw, not-yet-validated input (e.g. straight from a `File`'s `.type`,
   * which TypeScript can only see as `string`, not the narrower content-type
   * union) — `uploadProductImageSchema.parse()` below is what actually
   * narrows and validates it, so the param type here is deliberately loose.
   */
  input: {
    productId: string;
    contentType: string;
    sizeBytes: number;
    altText: string;
    isPrimary: boolean;
  };
  bytes: Uint8Array;
}

/**
 * `input.sizeBytes` is only used for the Zod bound check up front — the
 * value actually trusted for storage and persistence is `bytes.byteLength`
 * (what was actually received), never a caller-claimed number, so a lie
 * about size can't smuggle an oversized upload past validation.
 */
export async function uploadProductImage(
  actor: Session,
  { input, bytes }: UploadProductImageParams,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<ProductImage> {
  requirePermission(actor, "products:edit");
  const parsed = uploadProductImageSchema.parse(input);

  if (bytes.byteLength === 0 || bytes.byteLength > PRODUCT_IMAGE_MAX_SIZE_BYTES) {
    throw new ValidationError("Image exceeds the 5MB size limit or is empty.");
  }

  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  const imageId = randomUUID();
  const uploaded = await deps.productImages.upload(parsed.productId, imageId, parsed.contentType, bytes);

  const now = new Date();
  const newImage: ProductImage = {
    id: imageId,
    storagePath: uploaded.storagePath,
    contentType: uploaded.contentType,
    sizeBytes: bytes.byteLength,
    altText: parsed.altText,
    sortOrder: product.images.length,
    isPrimary: parsed.isPrimary || product.images.length === 0,
    uploadedAt: now,
    uploadedBy: actor.uid,
  };

  const nextImages = newImage.isPrimary
    ? [...product.images.map((image) => ({ ...image, isPrimary: false })), newImage]
    : [...product.images, newImage];

  try {
    await deps.products.update(parsed.productId, { images: nextImages }, product.version);
  } catch (error) {
    // The Storage write already succeeded but the metadata write didn't
    // commit (e.g. a concurrent edit bumped the version) — delete the
    // orphaned object rather than leaving an unreferenced file in the
    // bucket with no Firestore record pointing at it.
    await deps.productImages.delete(uploaded.storagePath).catch(() => undefined);
    throw error;
  }

  await deps.auditLogs.record({
    type: "product_image_uploaded",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId: parsed.productId, imageId },
  });

  return newImage;
}

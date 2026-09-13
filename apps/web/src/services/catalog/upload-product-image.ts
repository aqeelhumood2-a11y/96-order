import { randomUUID } from "node:crypto";
import type { Session } from "@/core/auth/entities";
import type { ProductImage } from "@/core/catalog/entities";
import { normalizeImageUrl } from "@/core/catalog/rules";
import { addProductImageByUrlSchema, PRODUCT_IMAGE_MAX_SIZE_BYTES, uploadProductImageSchema } from "@/core/catalog/schemas";
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

export interface AddProductImageByUrlParams {
  productId: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
}

/**
 * The alternative to `uploadProductImage` for a product image hosted
 * externally (e.g. a Google Drive share link converted to a direct-view
 * URL) instead of uploaded to this app's own Firebase Storage bucket —
 * added so a store isn't blocked on product photos when Storage is
 * misconfigured (see `infrastructure/firebase/product-image-storage.ts`'s
 * `bucket()` doc comment) or when an admin would simply rather paste a
 * link than upload a file.
 *
 * Stores the URL directly in `ProductImage.storagePath` — see
 * `core/catalog/rules.ts#isExternalImageUrl`'s doc comment for why one
 * field safely holds either kind of value and why every existing reader
 * needs no changes to support it. `contentType`/`sizeBytes` are never
 * verified against the remote host (there is no upload here to derive them
 * from truthfully), so they're recorded as unknown rather than guessed.
 * `parsed.imageUrl` is run through `normalizeImageUrl` first — see its doc
 * comment for why a raw Google Drive share link (what an admin actually
 * has on their phone, not the direct-view form the URL needs to be in) is
 * rewritten automatically rather than requiring a manual conversion step.
 */
export async function addProductImageByUrl(
  actor: Session,
  params: AddProductImageByUrlParams,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<ProductImage> {
  requirePermission(actor, "products:edit");
  const parsed = addProductImageByUrlSchema.parse(params);
  const imageUrl = normalizeImageUrl(parsed.imageUrl);

  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  const imageId = randomUUID();
  const now = new Date();
  const newImage: ProductImage = {
    id: imageId,
    storagePath: imageUrl,
    contentType: "unknown",
    sizeBytes: 0,
    altText: parsed.altText,
    sortOrder: product.images.length,
    isPrimary: parsed.isPrimary || product.images.length === 0,
    uploadedAt: now,
    uploadedBy: actor.uid,
  };

  const nextImages = newImage.isPrimary
    ? [...product.images.map((image) => ({ ...image, isPrimary: false })), newImage]
    : [...product.images, newImage];

  await deps.products.update(parsed.productId, { images: nextImages }, product.version);

  await deps.auditLogs.record({
    type: "product_image_uploaded",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId: parsed.productId, imageId, external: true },
  });

  return newImage;
}

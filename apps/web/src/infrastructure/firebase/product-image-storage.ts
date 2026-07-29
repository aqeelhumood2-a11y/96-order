import "server-only";
import { randomUUID } from "node:crypto";
import type { ProductImageStoragePort, UploadedProductImage } from "@/core/interfaces/product-image-storage-port";
import { getAdminStorage } from "./admin";

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * The storage path is built entirely from server-known values
 * (`productId`, a server-generated `imageId`, and a fixed extension
 * derived from the validated content type) — never from a filename or any
 * other value the caller supplies. This is what makes "no user-controlled
 * arbitrary paths" hold: there is no code path here that accepts a path
 * from outside this function.
 */
function buildStoragePath(productId: string, imageId: string, contentType: string): string {
  const extension = CONTENT_TYPE_EXTENSIONS[contentType];
  if (!extension) {
    throw new Error(`Unsupported content type for a product image: ${contentType}`);
  }
  return `products/${productId}/${imageId}.${extension}`;
}

/**
 * Admin preview access uses Firebase Storage's own "download token"
 * mechanism (a token stored in the object's custom metadata, embedded in
 * the URL as `?alt=media&token=...`) rather than a cryptographically
 * signed GCS URL. This is a deliberate choice, not an oversight: GCS
 * signed URLs require the calling identity to hold
 * `iam.serviceAccounts.signBlob` on itself — an IAM grant beyond plain
 * Application Default Credentials that has no equivalent at all against
 * the Storage emulator, since the emulator has no real IAM to check
 * (`getSignedUrl()` fails there with "Could not load the default
 * credentials", not a rules error). Download tokens work identically via
 * the Admin SDK in both production and the emulator, with zero extra IAM
 * configuration required of whoever deploys this.
 *
 * The tradeoff: unlike a signed URL, a download token does not expire on
 * its own — anyone who obtains the URL can view that image indefinitely
 * until the token is rotated (rotation isn't implemented in Phase 3). For
 * admin-only product photography with no customer PII and no public
 * storefront yet, this is an accepted tradeoff — see README's Known
 * limitations. It is not equivalent to "public": the token is a random
 * UUID never exposed anywhere except this admin-only preview flow, and
 * Storage Security Rules still deny every other access pattern.
 */
export class FirebaseProductImageStorage implements ProductImageStoragePort {
  private bucket() {
    return getAdminStorage().bucket();
  }

  async upload(productId: string, imageId: string, contentType: string, bytes: Uint8Array): Promise<UploadedProductImage> {
    const storagePath = buildStoragePath(productId, imageId, contentType);
    const file = this.bucket().file(storagePath);
    const downloadToken = randomUUID();
    await file.save(Buffer.from(bytes), {
      contentType,
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=0, no-transform",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });
    return { storagePath, contentType, sizeBytes: bytes.byteLength };
  }

  async delete(storagePath: string): Promise<void> {
    await this.bucket()
      .file(storagePath)
      .delete({ ignoreNotFound: true });
  }

  async getDownloadUrl(storagePath: string): Promise<string> {
    const file = this.bucket().file(storagePath);
    const [metadata] = await file.getMetadata();
    const token = (metadata.metadata as Record<string, string> | undefined)?.firebaseStorageDownloadTokens;
    if (!token) {
      throw new Error(`Product image at "${storagePath}" has no download token — was it uploaded through this class?`);
    }

    const encodedPath = encodeURIComponent(storagePath);
    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    const base = emulatorHost ? `http://${emulatorHost}` : "https://firebasestorage.googleapis.com";
    return `${base}/v0/b/${this.bucket().name}/o/${encodedPath}?alt=media&token=${token}`;
  }
}

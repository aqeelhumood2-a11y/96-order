import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirebaseProductImageStorage } from "@/infrastructure/firebase/product-image-storage";

const storage = new FirebaseProductImageStorage();

describe("FirebaseProductImageStorage (emulator)", () => {
  it("uploads bytes to a server-generated path derived from productId/imageId/content-type, and can delete it again", async () => {
    const productId = randomUUID();
    const imageId = randomUUID();
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);

    const uploaded = await storage.upload(productId, imageId, "image/jpeg", bytes);

    expect(uploaded.storagePath).toBe(`products/${productId}/${imageId}.jpg`);
    expect(uploaded.sizeBytes).toBe(bytes.byteLength);

    const url = await storage.getDownloadUrl(uploaded.storagePath);
    expect(url).toContain(encodeURIComponent(uploaded.storagePath));
    expect(url).toContain("alt=media");
    expect(url).toMatch(/token=[0-9a-f-]{36}/);

    await storage.delete(uploaded.storagePath);
  });

  it("derives a different extension per content type", async () => {
    const productId = randomUUID();
    const png = await storage.upload(productId, randomUUID(), "image/png", new Uint8Array([1]));
    const webp = await storage.upload(productId, randomUUID(), "image/webp", new Uint8Array([1]));

    expect(png.storagePath.endsWith(".png")).toBe(true);
    expect(webp.storagePath.endsWith(".webp")).toBe(true);
  });

  it("delete() on a path that was never uploaded is a safe no-op (ignoreNotFound)", async () => {
    await expect(storage.delete(`products/${randomUUID()}/${randomUUID()}.jpg`)).resolves.toBeUndefined();
  });

  it("getDownloadUrl() throws a clear error for an object with no download token", async () => {
    // Simulates an object that wasn't uploaded through this class (e.g. a
    // pre-existing object) — it should fail loudly, not silently return an
    // unusable URL.
    const productId = randomUUID();
    const imageId = randomUUID();
    const path = `products/${productId}/${imageId}.jpg`;
    // Upload without going through storage.upload() to skip the token.
    const { getAdminStorage } = await import("@/infrastructure/firebase/admin");
    await getAdminStorage().bucket().file(path).save(Buffer.from([1]), { contentType: "image/jpeg", resumable: false });

    await expect(storage.getDownloadUrl(path)).rejects.toThrow(/no download token/);
  });
});

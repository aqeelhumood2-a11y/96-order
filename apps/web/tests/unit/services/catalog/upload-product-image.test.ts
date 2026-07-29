import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import { uploadProductImage } from "@/services/catalog/upload-product-image";
import { createMockCatalogDeps, makeSession } from "./test-helpers";

const PRODUCT = { id: "prod-1", version: 1, images: [] };

function baseParams(overrides: Record<string, unknown> = {}) {
  return {
    input: { productId: "prod-1", contentType: "image/jpeg", sizeBytes: 100, altText: "A bag of coffee", isPrimary: false },
    bytes: new Uint8Array(100),
    ...overrides,
  };
}

describe("uploadProductImage", () => {
  it("404s when the product doesn't exist", async () => {
    const deps = createMockCatalogDeps();
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });
    await expect(uploadProductImage(actor, baseParams(), deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects bytes larger than the 5MB limit regardless of the claimed sizeBytes", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    const oversized = new Uint8Array(6 * 1024 * 1024);
    await expect(
      uploadProductImage(actor, { input: { productId: "prod-1", contentType: "image/jpeg", sizeBytes: 100, altText: "", isPrimary: false }, bytes: oversized }, deps),
    ).rejects.toThrow(ValidationError);
    expect(deps.productImages.upload).not.toHaveBeenCalled();
  });

  it("rejects an unsupported content type", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    await expect(
      uploadProductImage(actor, baseParams({ input: { productId: "prod-1", contentType: "image/gif", sizeBytes: 100, altText: "", isPrimary: false } }), deps),
    ).rejects.toThrow();
  });

  it("uploads, appends the image to the product, and audit-logs product_image_uploaded", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    const image = await uploadProductImage(actor, baseParams(), deps);

    expect(deps.products.update).toHaveBeenCalledWith("prod-1", { images: [expect.objectContaining({ id: image.id })] }, 1);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "product_image_uploaded" }));
  });

  it("the first uploaded image becomes primary automatically", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(PRODUCT);
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    const image = await uploadProductImage(actor, baseParams(), deps);
    expect(image.isPrimary).toBe(true);
  });

  it("deletes the orphaned Storage object if the metadata write fails (e.g. a stale version)", async () => {
    const deps = createMockCatalogDeps();
    deps.products.findById = vi.fn().mockResolvedValue(PRODUCT);
    deps.products.update = vi.fn().mockRejectedValue(new ConflictError("stale version"));
    const actor = makeSession({ effectivePermissions: new Set(["products:edit"]) });

    await expect(uploadProductImage(actor, baseParams(), deps)).rejects.toThrow(ConflictError);
    expect(deps.productImages.delete).toHaveBeenCalledWith("products/p1/img1.jpg");
  });
});

"use server";

import { revalidatePath } from "next/cache";
import type { CreateProductInput, UpdateProductInput } from "@/core/catalog/schemas";
import { ValidationError } from "@/core/errors";
import { runAction, type ActionResult } from "@/lib/action-result";
import { archiveProduct } from "@/services/catalog/archive-product";
import { createProduct } from "@/services/catalog/create-product";
import { deleteProductImage } from "@/services/catalog/delete-product-image";
import { updateProduct } from "@/services/catalog/update-product";
import { uploadProductImage } from "@/services/catalog/upload-product-image";
import { requireSession } from "@/services/auth/session";

export async function createProductAction(input: CreateProductInput): Promise<ActionResult<{ id: string }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const product = await createProduct(actor, input);
    return { id: product.id };
  });
  if (result.ok) revalidatePath("/admin/products");
  return result;
}

export async function updateProductAction(productId: string, input: UpdateProductInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await updateProduct(actor, productId, input);
    return null;
  });
  if (result.ok) {
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
  }
  return result;
}

export async function archiveProductAction(productId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await archiveProduct(actor, productId);
    return null;
  });
  if (result.ok) revalidatePath("/admin/products");
  return result;
}

/**
 * Takes `FormData` (not a JSON body) specifically so the browser's `File`
 * object can be passed straight through to a Server Action — Next.js
 * serializes it across the boundary natively. The route never trusts the
 * caller's claimed size/type beyond the initial Zod bound check;
 * `uploadProductImage` re-derives the real size from the received bytes.
 */
export async function uploadProductImageAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const productId = String(formData.get("productId") ?? "");

  const result = await runAction(async () => {
    const actor = await requireSession();
    const file = formData.get("file");
    const altText = String(formData.get("altText") ?? "");
    const isPrimary = formData.get("isPrimary") === "true";

    if (!(file instanceof File)) {
      throw new ValidationError("No file was uploaded.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = await uploadProductImage(
      actor,
      { input: { productId, contentType: file.type, sizeBytes: file.size, altText, isPrimary }, bytes },
    );
    return { id: image.id };
  });

  if (result.ok) revalidatePath(`/admin/products/${productId}`);
  return result;
}

export async function deleteProductImageAction(productId: string, imageId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await deleteProductImage(actor, productId, imageId);
    return null;
  });
  if (result.ok) revalidatePath(`/admin/products/${productId}`);
  return result;
}

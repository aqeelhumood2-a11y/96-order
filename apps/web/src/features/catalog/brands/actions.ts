"use server";

import { revalidatePath } from "next/cache";
import type { CreateBrandInput, UpdateBrandInput } from "@/core/catalog/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { createBrand } from "@/services/catalog/create-brand";
import { deleteBrand } from "@/services/catalog/delete-brand";
import { updateBrand } from "@/services/catalog/update-brand";
import { requireSession } from "@/services/auth/session";
import { revalidateStorefrontTag, STOREFRONT_CACHE_TAGS } from "@/services/storefront/cache";

export async function createBrandAction(input: CreateBrandInput): Promise<ActionResult<{ id: string }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const brand = await createBrand(actor, input);
    return { id: brand.id };
  });
  if (result.ok) {
    revalidatePath("/admin/brands");
    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.brands);
  }
  return result;
}

export async function updateBrandAction(brandId: string, input: UpdateBrandInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await updateBrand(actor, brandId, input);
    return null;
  });
  if (result.ok) {
    revalidatePath("/admin/brands");
    // A brand name/slug/active-state change also affects the brand ref
    // embedded in every product's cached storefront DTO.
    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.brands);
    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.products);
  }
  return result;
}

export async function deleteBrandAction(brandId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await deleteBrand(actor, brandId);
    return null;
  });
  if (result.ok) {
    revalidatePath("/admin/brands");
    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.brands);
  }
  return result;
}

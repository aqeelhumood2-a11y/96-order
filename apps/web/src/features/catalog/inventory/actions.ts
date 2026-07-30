"use server";

import { revalidatePath } from "next/cache";
import type { AdjustInventoryInput } from "@/core/catalog/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { adjustInventory } from "@/services/catalog/adjust-inventory";
import { requireSession } from "@/services/auth/session";
import { revalidateStorefrontTag, STOREFRONT_CACHE_TAGS } from "@/services/storefront/cache";

export async function adjustInventoryAction(
  input: AdjustInventoryInput,
): Promise<ActionResult<{ onHand: number; onHandBefore: number }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const { record, adjustment } = await adjustInventory(actor, input);
    return { onHand: record.onHand, onHandBefore: adjustment.onHandBefore };
  });
  if (result.ok) {
    revalidatePath("/admin/inventory");
    // Availability is cached alongside the rest of a product's storefront
    // DTO (see services/storefront/list-products.ts) — an adjustment that
    // changes in-stock/out-of-stock status should reflect promptly rather
    // than waiting out the cache's safety-net revalidation window.
    revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.products);
  }
  return result;
}

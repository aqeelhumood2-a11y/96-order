"use server";

import { revalidatePath } from "next/cache";
import type { AdjustInventoryInput } from "@/core/catalog/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { adjustInventory } from "@/services/catalog/adjust-inventory";
import { requireSession } from "@/services/auth/session";

export async function adjustInventoryAction(
  input: AdjustInventoryInput,
): Promise<ActionResult<{ onHand: number; onHandBefore: number }>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    const { record, adjustment } = await adjustInventory(actor, input);
    return { onHand: record.onHand, onHandBefore: adjustment.onHandBefore };
  });
  if (result.ok) revalidatePath("/admin/inventory");
  return result;
}

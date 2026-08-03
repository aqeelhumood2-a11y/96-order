"use server";

import { revalidatePath } from "next/cache";
import type { PromotionInput } from "@/core/promotions/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { createPromotion, setPromotionActive, updatePromotion } from "@/services/promotions/manage-promotions";

export async function createPromotionAction(input: PromotionInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await createPromotion(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/promotions");
  return result;
}

export async function updatePromotionAction(id: string, input: PromotionInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await updatePromotion(session, id, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/promotions");
  return result;
}

export async function setPromotionActiveAction(id: string, active: boolean): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await setPromotionActive(session, id, active);
    return null;
  });
  if (result.ok) revalidatePath("/admin/promotions");
  return result;
}

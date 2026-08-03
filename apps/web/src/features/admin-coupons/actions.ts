"use server";

import { revalidatePath } from "next/cache";
import type { CouponInput } from "@/core/coupons/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { createCoupon, setCouponActive, updateCoupon } from "@/services/coupons/manage-coupons";

export async function createCouponAction(input: CouponInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await createCoupon(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}

export async function updateCouponAction(code: string, input: CouponInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await updateCoupon(session, code, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}

export async function setCouponActiveAction(code: string, active: boolean): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await setCouponActive(session, code, active);
    return null;
  });
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}

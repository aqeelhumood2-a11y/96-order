"use server";

import { revalidatePath } from "next/cache";
import type { ModerateReviewInput, UpdateReviewInput } from "@/core/reviews/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { requireSession } from "@/services/auth/session";
import { createReview } from "@/services/reviews/create-review";
import { deleteMyReview, updateMyReview } from "@/services/reviews/update-review";
import { moderateReview } from "@/services/reviews/moderate-review";

export async function createReviewAction(productSlug: string, input: { productId: string; rating: number; title: string; body: string }): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await createReview(session, input);
    return null;
  });
  if (result.ok) revalidatePath(`/products/${productSlug}`);
  return result;
}

export async function updateMyReviewAction(productSlug: string, reviewId: string, input: UpdateReviewInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await updateMyReview(session, reviewId, input);
    return null;
  });
  if (result.ok) revalidatePath(`/products/${productSlug}`);
  return result;
}

export async function deleteMyReviewAction(productSlug: string, reviewId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await deleteMyReview(session, reviewId);
    return null;
  });
  if (result.ok) revalidatePath(`/products/${productSlug}`);
  return result;
}

export async function moderateReviewAction(reviewId: string, input: ModerateReviewInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await moderateReview(session, reviewId, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/reviews");
  return result;
}

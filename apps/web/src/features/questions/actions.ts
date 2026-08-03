"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { requireSession } from "@/services/auth/session";
import { askQuestion } from "@/services/questions/ask-question";
import { answerQuestion, rejectQuestion } from "@/services/questions/answer-question";

export async function askQuestionAction(productSlug: string, productId: string, question: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await askQuestion(session, { productId, question });
    return null;
  });
  if (result.ok) revalidatePath(`/products/${productSlug}`);
  return result;
}

export async function answerQuestionAction(questionId: string, answer: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await answerQuestion(session, questionId, { answer });
    return null;
  });
  if (result.ok) revalidatePath("/admin/questions");
  return result;
}

export async function rejectQuestionAction(questionId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await rejectQuestion(session, questionId);
    return null;
  });
  if (result.ok) revalidatePath("/admin/questions");
  return result;
}

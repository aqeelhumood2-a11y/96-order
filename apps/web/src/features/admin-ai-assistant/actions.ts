"use server";

import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { askAdminAssistant } from "@/services/ai-assistant/ask-assistant";

export async function askAdminAssistantAction(question: string): Promise<ActionResult<{ answer: string; generatedByAI: boolean }>> {
  return runAction(async () => {
    const actor = await requireSession();
    return askAdminAssistant(actor, question);
  });
}

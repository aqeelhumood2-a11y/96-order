"use server";

import { revalidatePath } from "next/cache";
import type { PosIntegrationInput } from "@/core/integrations/schemas";
import { requirePermission, requireSession } from "@/services/auth/session";
import { retryFailedEmails, type RetryFailedEmailsResult } from "@/services/email/retry-failed-emails";
import { retryFailedNotifications, type RetryFailedNotificationsResult } from "@/services/back-in-stock/retry-failed-notifications";
import { updatePosIntegration } from "@/services/integrations/manage-pos-integration";
import { runAction, type ActionResult } from "@/lib/action-result";

/** Manual, admin-triggered run of the same worker `/api/jobs/retry-failed-emails` runs on a schedule — for when an admin doesn't want to wait for the next scheduled pass. */
export async function retryFailedEmailsAction(): Promise<ActionResult<RetryFailedEmailsResult>> {
  return runAction(async () => {
    const actor = await requireSession();
    requirePermission(actor, "integrations:manage");
    return retryFailedEmails();
  });
}

/** Manual, admin-triggered run of the same worker `/api/jobs/retry-failed-notifications` runs on a schedule. */
export async function retryFailedNotificationsAction(): Promise<ActionResult<RetryFailedNotificationsResult>> {
  return runAction(async () => {
    const actor = await requireSession();
    requirePermission(actor, "integrations:manage");
    return retryFailedNotifications();
  });
}

export async function updatePosIntegrationAction(input: PosIntegrationInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const actor = await requireSession();
    await updatePosIntegration(actor, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/integrations");
  return result;
}

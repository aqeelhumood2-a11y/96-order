"use server";

import { requirePermission, requireSession } from "@/services/auth/session";
import { retryFailedEmails, type RetryFailedEmailsResult } from "@/services/email/retry-failed-emails";
import { runAction, type ActionResult } from "@/lib/action-result";

/** Manual, admin-triggered run of the same worker `/api/jobs/retry-failed-emails` runs on a schedule — for when an admin doesn't want to wait for the next scheduled pass. */
export async function retryFailedEmailsAction(): Promise<ActionResult<RetryFailedEmailsResult>> {
  return runAction(async () => {
    const actor = await requireSession();
    requirePermission(actor, "integrations:manage");
    return retryFailedEmails();
  });
}

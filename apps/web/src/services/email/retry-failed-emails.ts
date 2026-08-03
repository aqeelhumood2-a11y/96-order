import { EMAIL_RETRY_BATCH_LIMIT, EMAIL_RETRY_MAX_ATTEMPTS } from "@/config/jobs";
import { defaultEmailDeps, type EmailDeps } from "./dependencies";

export interface RetryFailedEmailsResult {
  attempted: number;
  succeeded: number;
  stillFailing: number;
}

/**
 * Drains up to `EMAIL_RETRY_BATCH_LIMIT` still-retryable entries from the
 * durable outbox (`EmailOutboxRepository.listRetryable` — least-retried
 * first) and makes one more delivery attempt each, same success/failure
 * bookkeeping `services/email/send-transactional-email.ts` uses for the
 * original attempt. Meant to be invoked on a schedule via
 * `/api/jobs/retry-failed-emails` (see `lib/verify-job-secret.ts`) — this
 * is the retry worker `core/interfaces/email-outbox-repository.ts` was
 * always designed for but Phase 5 didn't yet build.
 */
export async function retryFailedEmails(deps: EmailDeps = defaultEmailDeps): Promise<RetryFailedEmailsResult> {
  const entries = await deps.outbox.listRetryable(EMAIL_RETRY_MAX_ATTEMPTS, EMAIL_RETRY_BATCH_LIMIT);

  let succeeded = 0;
  for (const entry of entries) {
    const result = await deps.email.send({ to: entry.to, template: entry.template, data: entry.data });
    if (result.sent) {
      await deps.outbox.markSent(entry.id);
      succeeded += 1;
    } else {
      await deps.outbox.markFailed(entry.id, result.error ?? "Unknown email delivery error");
    }
  }

  return { attempted: entries.length, succeeded, stillFailing: entries.length - succeeded };
}

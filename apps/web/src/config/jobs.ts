/**
 * Background job configuration. `/api/jobs/*` and `/api/integrations/*`
 * routes are meant to be invoked by an external scheduler (Cloud
 * Scheduler, GitHub Actions cron, etc.), not a logged-in admin — see
 * `lib/verify-job-secret.ts` for the shared-secret auth these values gate.
 */

/** How many times `retryFailedEmails` will retry one outbox entry before giving up on it — matches `attempts` on `EmailOutboxEntry`. */
export const EMAIL_RETRY_MAX_ATTEMPTS = 5;

/** Bound on how many failed emails one `retryFailedEmails` invocation drains — keeps a single scheduled run fast and its Firestore read cost predictable. */
export const EMAIL_RETRY_BATCH_LIMIT = 50;

/** Default lookback window for the daily order sync API when the caller doesn't pass explicit `from`/`to` query params. */
export const ORDER_SYNC_DEFAULT_WINDOW_HOURS = 24;

export const ORDER_SYNC_MAX_RESULTS = 1000;

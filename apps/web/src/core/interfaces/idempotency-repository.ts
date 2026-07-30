export const IDEMPOTENCY_RECORD_STATUSES = ["in_progress", "completed", "failed"] as const;
export type IdempotencyRecordStatus = (typeof IDEMPOTENCY_RECORD_STATUSES)[number];

export interface IdempotencyRecord {
  key: string;
  /** Namespaces keys so, e.g., checkout and cash-confirmation idempotency keys can never collide even if a caller reused a value. */
  scope: string;
  status: IdempotencyRecordStatus;
  /** Set once `status` is `completed` — e.g. the id of the order the operation produced. */
  resultRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single, general-purpose idempotency mechanism reused across every
 * Phase 5 mutation that needs one (checkout submission, reservation,
 * reservation release, cash confirmation — see README's Idempotency
 * section) rather than a bespoke check per use case. `begin` is the whole
 * mechanism: it's the one atomic operation that decides, under concurrent
 * duplicate calls, which caller is "first" — every other method here is
 * just bookkeeping once that's settled.
 */
export interface IdempotencyRepository {
  /**
   * Atomically creates an `in_progress` record for `(scope, key)` if none
   * exists yet; if one already does (`in_progress`, `completed`, or
   * `failed`), returns it unchanged instead — `created: false` tells the
   * caller "someone else already owns this key" (a duplicate submission),
   * `created: true` means "you're the first, proceed."
   */
  begin(scope: string, key: string): Promise<{ record: IdempotencyRecord; created: boolean }>;
  complete(scope: string, key: string, resultRef: string): Promise<void>;
  fail(scope: string, key: string): Promise<void>;
}

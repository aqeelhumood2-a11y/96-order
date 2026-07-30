import type { EmailTemplate } from "./email-port";

export const EMAIL_OUTBOX_STATUSES = ["pending", "sent", "failed"] as const;
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number];

export interface EmailOutboxEntry {
  id: string;
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  status: EmailOutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewEmailOutboxEntry = Pick<EmailOutboxEntry, "to" | "template" | "data">;

/**
 * A durable record of every transactional email the app has ever tried to
 * send, independent of whether the immediate best-effort `EmailPort.send`
 * attempt succeeded — this *is* Phase 5's retry seam: no background
 * worker retries `"failed"` entries yet (see README's Known limitations),
 * but the durable record they'd need to scan already exists, so adding
 * one later is additive.
 */
export interface EmailOutboxRepository {
  enqueue(entry: NewEmailOutboxEntry): Promise<EmailOutboxEntry>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

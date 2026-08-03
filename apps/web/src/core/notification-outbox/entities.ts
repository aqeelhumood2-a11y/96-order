export const NOTIFICATION_OUTBOX_STATUSES = ["pending", "sent", "failed"] as const;
export type NotificationOutboxStatus = (typeof NOTIFICATION_OUTBOX_STATUSES)[number];

/** Only one job type today; the field exists so a future notification kind (e.g. price-drop alerts) is additive, not a schema change. */
export const NOTIFICATION_JOB_TYPES = ["back_in_stock"] as const;
export type NotificationJobType = (typeof NOTIFICATION_JOB_TYPES)[number];

/**
 * A durable record of every back-in-stock notification attempt — the
 * `notificationOutbox` collection called for in the Phase 7 spec, kept
 * deliberately separate from Phase 5's `emailOutbox`
 * (`core/interfaces/email-outbox-repository.ts`). `emailOutbox` records
 * "did we try to send this email"; this collection instead records "did
 * this subscription get notified for this restock", which is what
 * `/admin/notifications/back-in-stock` needs to show and what a future
 * retry job would scan by `status == "failed"` — see
 * `services/back-in-stock/notify-restock.ts`.
 */
export interface NotificationOutboxEntry {
  id: string;
  type: NotificationJobType;
  subscriptionId: string;
  email: string;
  productId: string;
  variantId: string | null;
  status: NotificationOutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewNotificationOutboxEntry = Pick<NotificationOutboxEntry, "type" | "subscriptionId" | "email" | "productId" | "variantId">;

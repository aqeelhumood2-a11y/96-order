import type { NewNotificationOutboxEntry, NotificationOutboxEntry, NotificationOutboxStatus } from "@/core/notification-outbox/entities";
import type { Page, PageRequest } from "./repository";

export interface ListNotificationOutboxRequest extends PageRequest {
  status?: NotificationOutboxStatus;
}

/** Mirrors `EmailOutboxRepository`'s enqueue/markSent/markFailed shape exactly — see `core/notification-outbox/entities.ts` for why this is a separate collection. */
export interface NotificationOutboxRepository {
  enqueue(entry: NewNotificationOutboxEntry): Promise<NotificationOutboxEntry>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  /** `/admin/notifications/back-in-stock` — newest first, optionally filtered by status. */
  list(request: ListNotificationOutboxRequest): Promise<Page<NotificationOutboxEntry>>;
}

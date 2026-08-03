import type { Session } from "@/core/auth/entities";
import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import type { NotificationOutboxEntry } from "@/core/notification-outbox/entities";
import type { ListNotificationOutboxRequest } from "@/core/interfaces/notification-outbox-repository";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

/** `/admin/notifications/back-in-stock` — every subscription (any status), newest first. */
export async function adminListBackInStockSubscriptions(actor: Session, request: PageRequest, deps: BackInStockDeps = defaultBackInStockDeps): Promise<Page<BackInStockSubscription>> {
  requirePermission(actor, "notifications:view");
  return deps.subscriptions.list(request);
}

/** Same page — the notification-job side, showing what actually got sent/failed for each restock event. */
export async function adminListNotificationOutbox(actor: Session, request: ListNotificationOutboxRequest, deps: BackInStockDeps = defaultBackInStockDeps): Promise<Page<NotificationOutboxEntry>> {
  requirePermission(actor, "notifications:view");
  return deps.notificationOutbox.list(request);
}

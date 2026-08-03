import { EMAIL_RETRY_BATCH_LIMIT, EMAIL_RETRY_MAX_ATTEMPTS } from "@/config/jobs";
import { SITE_URL } from "@/config/site";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

export interface RetryFailedNotificationsResult {
  attempted: number;
  succeeded: number;
  stillFailing: number;
}

/**
 * Drains up to `EMAIL_RETRY_BATCH_LIMIT` still-retryable `notificationOutbox`
 * entries the same way `services/email/retry-failed-emails.ts` drains
 * `emailOutbox` (least-retried first, same reuses of `EMAIL_RETRY_*`
 * config since both outboxes share one retry policy). Unlike `emailOutbox`,
 * a `notificationOutbox` entry doesn't carry pre-rendered subject/text — it
 * only records product/subscription ids (see
 * `core/notification-outbox/entities.ts`) — so this re-fetches the product
 * and subscription to reconstruct the same email `notifyBackInStock`
 * originally built, exactly as that function does. A subscription or
 * product that no longer exists (deleted since the original attempt) is
 * treated as permanently unretryable and marked failed without another
 * send attempt, rather than retried forever.
 */
export async function retryFailedNotifications(deps: BackInStockDeps = defaultBackInStockDeps): Promise<RetryFailedNotificationsResult> {
  const entries = await deps.notificationOutbox.listRetryable(EMAIL_RETRY_MAX_ATTEMPTS, EMAIL_RETRY_BATCH_LIMIT);

  let succeeded = 0;
  for (const entry of entries) {
    const [product, subscription] = await Promise.all([deps.products.findById(entry.productId), deps.subscriptions.findById(entry.subscriptionId)]);

    if (!product || !subscription) {
      await deps.notificationOutbox.markFailed(entry.id, "Product or subscription no longer exists.");
      continue;
    }

    const productUrl = `${SITE_URL}/products/${product.slug}`;
    const unsubscribeUrl = `${SITE_URL}/unsubscribe/back-in-stock?id=${subscription.id}&token=${subscription.unsubscribeToken}`;
    const result = await deps.email.send({ to: entry.email, template: "back_in_stock", data: { productName: product.name, productUrl, unsubscribeUrl } });

    if (result.sent) {
      await deps.notificationOutbox.markSent(entry.id);
      await deps.subscriptions.markNotified(subscription.id);
      succeeded += 1;
    } else {
      await deps.notificationOutbox.markFailed(entry.id, result.error ?? "Unknown email delivery error");
    }
  }

  return { attempted: entries.length, succeeded, stillFailing: entries.length - succeeded };
}

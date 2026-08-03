import { SITE_URL } from "@/config/site";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

/**
 * Called (via `after()`, never awaited inline — see
 * `services/catalog/adjust-inventory.ts`) whenever an inventory adjustment
 * takes a product/variant from out-of-stock to in-stock. Fans out to every
 * `"pending"` subscription for that product/variant: enqueues a
 * `notificationOutbox` job first (the durable retry seam), then makes a
 * best-effort send. A signed-in subscriber who has since turned off their
 * `notificationPreferences.backInStock` toggle is skipped entirely (no
 * outbox job, no email) but still marked notified, since the underlying
 * "let me know when this is back" intent has been fulfilled either way.
 *
 * Never throws — one subscriber's lookup or send failure must never stop
 * the rest of the batch, and (per the spec) can never be allowed to affect
 * the inventory adjustment that triggered this in the first place.
 */
export async function notifyBackInStock(productId: string, variantId: string | null, deps: BackInStockDeps = defaultBackInStockDeps): Promise<void> {
  try {
    const product = await deps.products.findById(productId);
    if (!product) return;

    const subscriptions = await deps.subscriptions.listPendingByProduct(productId, variantId);
    if (subscriptions.length === 0) return;

    const productUrl = `${SITE_URL}/products/${product.slug}`;

    for (const subscription of subscriptions) {
      try {
        if (subscription.customerUid) {
          const account = await deps.accounts.findByUid(subscription.customerUid);
          if (account && !account.notificationPreferences.backInStock) {
            await deps.subscriptions.markNotified(subscription.id);
            continue;
          }
        }

        const job = await deps.notificationOutbox.enqueue({
          type: "back_in_stock",
          subscriptionId: subscription.id,
          email: subscription.email,
          productId,
          variantId,
        });

        const unsubscribeUrl = `${SITE_URL}/unsubscribe/back-in-stock?id=${subscription.id}&token=${subscription.unsubscribeToken}`;
        const result = await deps.email.send({ to: subscription.email, template: "back_in_stock", data: { productName: product.name, productUrl, unsubscribeUrl } });

        if (result.sent) {
          await deps.notificationOutbox.markSent(job.id);
          await deps.subscriptions.markNotified(subscription.id);
          await deps.auditLogs.record({
            type: "back_in_stock_notification_sent",
            actorUid: null,
            actorEmail: subscription.email,
            metadata: { productId, variantId, subscriptionId: subscription.id },
          });
        } else {
          await deps.notificationOutbox.markFailed(job.id, result.error ?? "Unknown email delivery error");
        }
      } catch {
        // One subscriber's failure never stops the rest of the batch.
      }
    }
  } catch {
    // Restock notification is best-effort and must never surface to the caller.
  }
}

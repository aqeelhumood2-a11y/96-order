import type { CustomerSession } from "@/core/customer-auth/entities";
import { NotFoundError } from "@/core/errors";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

/**
 * Guest-safe unsubscribe: the emailed link carries `id` + `unsubscribeToken`
 * (see `core/back-in-stock/entities.ts`'s doc comment on why a plain token
 * is an acceptable design here), and a mismatch on either is reported as
 * the identical "not found" outcome — never "wrong token" vs. "no such
 * subscription" — so the link can't be used to probe for valid ids.
 */
export async function unsubscribeFromBackInStockByToken(id: string, token: string, deps: BackInStockDeps = defaultBackInStockDeps): Promise<void> {
  const subscription = await deps.subscriptions.findById(id);
  if (!subscription || subscription.unsubscribeToken !== token) {
    throw new NotFoundError("Subscription not found.");
  }

  await deps.subscriptions.cancel(id);
  await deps.auditLogs.record({
    type: "back_in_stock_unsubscribed",
    actorUid: subscription.customerUid,
    actorEmail: subscription.email,
    metadata: { productId: subscription.productId, variantId: subscription.variantId },
  });
}

/** Signed-in path from `/account/notifications` — ownership is the session's uid, no token needed. */
export async function unsubscribeMyBackInStock(session: CustomerSession, subscriptionId: string, deps: BackInStockDeps = defaultBackInStockDeps): Promise<void> {
  const subscription = await deps.subscriptions.findById(subscriptionId);
  if (!subscription || subscription.customerUid !== session.uid) {
    throw new NotFoundError("Subscription not found.");
  }

  await deps.subscriptions.cancel(subscriptionId);
  await deps.auditLogs.record({
    type: "back_in_stock_unsubscribed",
    actorUid: session.uid,
    actorEmail: session.email,
    metadata: { productId: subscription.productId, variantId: subscription.variantId },
  });
}

import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { defaultBackInStockDeps, type BackInStockDeps } from "./dependencies";

export interface BackInStockSubscriptionView extends BackInStockSubscription {
  productName: string | null;
  productSlug: string | null;
}

export async function listMyBackInStockSubscriptions(session: CustomerSession, deps: BackInStockDeps = defaultBackInStockDeps): Promise<BackInStockSubscriptionView[]> {
  const subscriptions = await deps.subscriptions.listByCustomer(session.uid);
  const views: BackInStockSubscriptionView[] = [];
  for (const subscription of subscriptions) {
    const product = await deps.products.findById(subscription.productId);
    views.push({ ...subscription, productName: product?.name ?? null, productSlug: product?.slug ?? null });
  }
  return views;
}

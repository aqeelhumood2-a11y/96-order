import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import type { Page, PageRequest } from "./repository";

export interface BackInStockRepository {
  findById(id: string): Promise<BackInStockSubscription | null>;
  listByCustomer(customerUid: string): Promise<BackInStockSubscription[]>;
  /** Only `status == "pending"` rows for this product/variant — what `notifyBackInStock` fans out to. */
  listPendingByProduct(productId: string, variantId: string | null): Promise<BackInStockSubscription[]>;
  /**
   * Idempotent upsert keyed by `backInStockSubscriptionId`: creates a
   * `"pending"` row if none exists, or flips an existing `"notified"`/
   * `"cancelled"` row back to `"pending"` (re-subscribing after being
   * notified, or after unsubscribing, is expected). An already-`"pending"`
   * row is returned unchanged — never a duplicate.
   */
  subscribe(subscription: BackInStockSubscription): Promise<BackInStockSubscription>;
  markNotified(id: string): Promise<void>;
  cancel(id: string): Promise<void>;
  /** `/admin/notifications/back-in-stock` — newest first. */
  list(request: PageRequest): Promise<Page<BackInStockSubscription>>;
}

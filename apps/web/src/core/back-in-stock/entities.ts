export const BACK_IN_STOCK_STATUSES = ["pending", "notified", "cancelled"] as const;
export type BackInStockStatus = (typeof BACK_IN_STOCK_STATUSES)[number];

/**
 * One row per (email, product, variant) — deterministic id (see
 * `backInStockSubscriptionId`) so subscribing twice for the same item is
 * naturally idempotent, satisfying the spec's "no duplicates" requirement
 * without a query-then-check race. Keyed by email rather than
 * `customerUid` because a guest with no account must be able to subscribe
 * too; `customerUid` is still recorded when the subscriber is signed in,
 * purely so `/account/notifications` can list "my" subscriptions without
 * an email-equality query.
 */
export interface BackInStockSubscription {
  id: string;
  customerUid: string | null;
  email: string;
  productId: string;
  variantId: string | null;
  status: BackInStockStatus;
  /**
   * A convenience capability token for the emailed unsubscribe link — not a
   * security-sensitive secret like a password-reset token (worst case of
   * disclosure is someone else cancelling this one low-value alert), so
   * unlike `core/customer-auth/rules.ts`'s hashed, single-use verification
   * tokens, this is stored in plain form directly on the subscription.
   */
  unsubscribeToken: string;
  createdAt: Date;
  notifiedAt: Date | null;
}

export function backInStockSubscriptionId(email: string, productId: string, variantId: string | null): string {
  return `${email.trim().toLowerCase()}:${productId}:${variantId ?? "-"}`;
}

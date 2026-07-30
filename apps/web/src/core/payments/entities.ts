import type { CurrencyCode, Money } from "@/core/money/money";

export const PAYMENT_METHODS = ["cash", "tap"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * `refunded` is a modeled status only in Phase 5 — no refund-execution
 * flow exists yet (see README's Known limitations). `cash_pending`/
 * `cash_confirmed` are cash-on-delivery/pickup's own two-step lifecycle
 * (reserved at order time, converted to a real deduction only once an
 * authorized admin confirms cash receipt) and never apply to a `tap`
 * payment; `pending`/`authorized`/`paid`/`failed`/`cancelled` never apply
 * to `cash`. The two method's status sets are kept in one union (rather
 * than two separate discriminated types) because `Order.paymentStatus`
 * needs exactly one field whose meaning depends on `Order.paymentMethod`.
 */
export const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "cash_pending",
  "cash_confirmed",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Payment statuses that mean "inventory may be permanently committed" — see `services/inventory/reservations.ts`. */
export const PAYMENT_STATUSES_AUTHORIZING_COMMIT: readonly PaymentStatus[] = ["paid", "cash_confirmed"];

/** Payment statuses that mean "release whatever inventory was reserved for this order." */
export const PAYMENT_STATUSES_REQUIRING_RELEASE: readonly PaymentStatus[] = ["failed", "cancelled"];

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  currency: CurrencyCode;
  /** Tap's charge/session id — absent for `cash`. */
  providerReference?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One row per processed provider webhook delivery, keyed by the
 * provider's own event id — this *is* the idempotency mechanism for
 * webhook processing (see `services/payments/handle-tap-webhook.ts`): a
 * second delivery of the same event id is recognized and skipped before
 * any state changes, rather than trusting the provider to never redeliver.
 */
export interface PaymentWebhookEvent {
  id: string;
  provider: "tap";
  paymentId: string | null;
  eventType: string;
  receivedAt: Date;
  processedAt: Date | null;
}

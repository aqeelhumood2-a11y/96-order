import type { CurrencyCode, Money } from "@/core/money/money";
import type { OrderStatus } from "@/core/orders/entities";

/**
 * One row of a daily/weekly/monthly sales report — `periodStart` is
 * always the UTC start of the bucket (midnight for a day, the Monday of
 * an ISO week, the 1st of a month), and `periodLabel` is the fixed,
 * sortable string a report table actually renders (`"2026-08-03"`,
 * `"2026-W31"`, `"2026-08"`). Buckets with zero orders are still included
 * (see `core/reports/rules.ts#bucketOrders`) so a report never silently
 * skips a quiet day/week/month.
 */
export interface SalesBucket {
  periodStart: Date;
  periodLabel: string;
  orderCount: number;
  revenue: Money;
}

export interface BestSellingProductRow {
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: Money;
}

export interface OrdersByStatusRow {
  status: OrderStatus;
  count: number;
}

/**
 * Cash-on-delivery/pickup summary over a date range — README's Cash order
 * lifecycle. `pending` is cash collected but not yet confirmed by an
 * admin (inventory only reserved, not committed); `confirmed` is cash an
 * admin has verified was received (see `services/payments/confirm-cash-payment.ts`).
 * A cancelled cash order counts in neither bucket, matching
 * `countsTowardRevenue`.
 */
export interface CashPaymentsSummary {
  pendingCount: number;
  pendingTotal: Money;
  confirmedCount: number;
  confirmedTotal: Money;
  deliveryCount: number;
  pickupCount: number;
}

/** Online (Tap) payment summary over a date range — every `PaymentStatus` that only ever applies to a `tap` order. */
export interface OnlinePaymentsSummary {
  paidCount: number;
  paidTotal: Money;
  pendingCount: number;
  authorizedCount: number;
  failedCount: number;
  cancelledCount: number;
  refundedCount: number;
  refundedTotal: Money;
}

/**
 * One live, actionable row per still-`cash_pending` order — not a
 * historical bucketed report like the two summaries above, but the
 * "worklist" of cash an admin still needs to go collect/confirm. Oldest
 * first, so the longest-outstanding order surfaces at the top.
 */
export interface PendingCashCollectionRow {
  orderId: string;
  orderNumber: string;
  customerName: string;
  fulfillmentMethod: "delivery" | "pickup";
  grandTotal: Money;
  createdAt: Date;
}

export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

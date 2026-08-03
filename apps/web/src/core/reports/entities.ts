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

export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

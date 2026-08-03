import { ACTIVE_CURRENCY, add, type Money } from "@/core/money/money";
import { ORDER_STATUSES, type OrderLine, type OrderStatus } from "@/core/orders/entities";
import type { BestSellingProductRow, OrdersByStatusRow, SalesBucket } from "./entities";
import { zeroMoney } from "./entities";

/**
 * Statuses whose `grandTotal` counts as realized revenue. `pending_payment`
 * is deliberately excluded — the money hasn't actually been collected or
 * even guaranteed yet (an unpaid `tap` order can still fail or expire) —
 * and `cancelled` is excluded for the obvious reason. Every other status
 * implies the order was accepted (a `cash` order is `confirmed`
 * immediately; a `tap` order only reaches `confirmed` once the webhook
 * reports `paid`), so it counts from `confirmed` onward.
 */
export function countsTowardRevenue(status: OrderStatus): boolean {
  return status !== "pending_payment" && status !== "cancelled";
}

export type ReportPeriod = "day" | "week" | "month";

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/** UTC midnight of `date`'s own day. */
function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** UTC Monday of the ISO week `date` falls in. */
function startOfWeekUTC(date: Date): Date {
  const day = startOfDayUTC(date);
  const weekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay(); // 1 (Mon) .. 7 (Sun)
  day.setUTCDate(day.getUTCDate() - (weekday - 1));
  return day;
}

/** UTC 1st-of-month of `date`'s own month. */
function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** ISO 8601 week number (1-53) of the Monday-anchored week `date` belongs to. */
function isoWeekOf(date: Date): { isoYear: number; isoWeek: number } {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = target.getUTCDay() === 0 ? 7 : target.getUTCDay();
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const isoYearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const isoWeek = Math.ceil(((target.getTime() - isoYearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear: target.getUTCFullYear(), isoWeek };
}

function periodStartOf(date: Date, period: ReportPeriod): Date {
  if (period === "day") return startOfDayUTC(date);
  if (period === "week") return startOfWeekUTC(date);
  return startOfMonthUTC(date);
}

function periodLabelOf(periodStart: Date, period: ReportPeriod): string {
  if (period === "day") {
    return `${periodStart.getUTCFullYear()}-${pad2(periodStart.getUTCMonth() + 1)}-${pad2(periodStart.getUTCDate())}`;
  }
  if (period === "month") {
    return `${periodStart.getUTCFullYear()}-${pad2(periodStart.getUTCMonth() + 1)}`;
  }
  const { isoYear, isoWeek } = isoWeekOf(periodStart);
  return `${isoYear}-W${pad2(isoWeek)}`;
}

function nextPeriodStart(periodStart: Date, period: ReportPeriod): Date {
  const next = new Date(periodStart);
  if (period === "day") next.setUTCDate(next.getUTCDate() + 1);
  else if (period === "week") next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export interface OrderForReport {
  status: OrderStatus;
  grandTotal: Money;
  createdAt: Date;
}

/**
 * Buckets a bounded set of orders (the caller already fetched a date-range
 * page — this never re-queries anything) into fixed day/week/month
 * buckets spanning `[from, to]` inclusive, filling every empty bucket
 * with a zero-count row so a report table never has a silently missing
 * row for a quiet period. Only `countsTowardRevenue` orders contribute to
 * `orderCount`/`revenue` — a `pending_payment` or `cancelled` order is
 * counted in neither, matching what "Total orders"/"Revenue" mean on the
 * dashboard.
 */
export function bucketOrders(orders: readonly OrderForReport[], from: Date, to: Date, period: ReportPeriod): SalesBucket[] {
  const currency = ACTIVE_CURRENCY.code;
  const buckets = new Map<string, SalesBucket>();

  let cursor = periodStartOf(from, period);
  const end = periodStartOf(to, period);
  while (cursor.getTime() <= end.getTime()) {
    const label = periodLabelOf(cursor, period);
    buckets.set(label, { periodStart: new Date(cursor), periodLabel: label, orderCount: 0, revenue: zeroMoney(currency) });
    cursor = nextPeriodStart(cursor, period);
  }

  for (const order of orders) {
    if (!countsTowardRevenue(order.status)) continue;
    const label = periodLabelOf(periodStartOf(order.createdAt, period), period);
    const bucket = buckets.get(label);
    if (!bucket) continue; // outside [from, to] — the caller's own query should already exclude this, defensive only.
    bucket.orderCount += 1;
    bucket.revenue = add(bucket.revenue, order.grandTotal);
  }

  return Array.from(buckets.values()).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}

/** Every `ORDER_STATUSES` value, in a fixed order, each with its count in `orders` — always includes a zero row for a status nobody currently has, so the dashboard's status breakdown never has a missing bar/tile. */
export function computeOrdersByStatus(orders: readonly { status: OrderStatus }[]): OrdersByStatusRow[] {
  const counts = new Map<OrderStatus, number>(ORDER_STATUSES.map((status) => [status, 0]));
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }
  return ORDER_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export interface OrderLinesForReport {
  status: OrderStatus;
  lines: readonly Pick<OrderLine, "productId" | "variantId" | "productName" | "sku" | "quantity" | "lineTotal">[];
}

/**
 * Aggregates line-item quantity/revenue across a bounded set of orders,
 * keyed by `productId:variantId` (the same convention `core/cart/rules.ts#cartLineKey`
 * uses), and returns the top `limit` by quantity sold. Only lines from
 * `countsTowardRevenue` orders are counted — an unpaid or cancelled
 * order's items never inflate a "best seller" ranking.
 */
export function computeBestSellingProducts(orders: readonly OrderLinesForReport[], limit: number): BestSellingProductRow[] {
  const rows = new Map<string, BestSellingProductRow>();

  for (const order of orders) {
    if (!countsTowardRevenue(order.status)) continue;
    for (const line of order.lines) {
      const key = `${line.productId}:${line.variantId ?? "-"}`;
      const existing = rows.get(key);
      if (existing) {
        existing.quantitySold += line.quantity;
        existing.revenue = add(existing.revenue, line.lineTotal);
      } else {
        rows.set(key, {
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          sku: line.sku,
          quantitySold: line.quantity,
          revenue: line.lineTotal,
        });
      }
    }
  }

  return Array.from(rows.values())
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);
}

export const DEFAULT_CURRENCY = ACTIVE_CURRENCY.code;

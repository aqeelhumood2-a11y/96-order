import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import type { OrderLine } from "@/core/orders/entities";
import {
  bucketOrders,
  computeBestSellingProducts,
  computeCashPaymentsSummary,
  computeOnlinePaymentsSummary,
  computeOrdersByStatus,
  countsTowardRevenue,
  type OrderForReport,
  type OrderLinesForReport,
} from "@/core/reports/rules";

describe("countsTowardRevenue", () => {
  it("excludes pending_payment and cancelled, includes everything else", () => {
    expect(countsTowardRevenue("pending_payment")).toBe(false);
    expect(countsTowardRevenue("cancelled")).toBe(false);
    expect(countsTowardRevenue("confirmed")).toBe(true);
    expect(countsTowardRevenue("preparing")).toBe(true);
    expect(countsTowardRevenue("ready")).toBe(true);
    expect(countsTowardRevenue("out_for_delivery")).toBe(true);
    expect(countsTowardRevenue("completed")).toBe(true);
  });
});

function makeOrder(overrides: Partial<OrderForReport> = {}): OrderForReport {
  return {
    status: "confirmed",
    grandTotal: money(1000),
    createdAt: new Date("2026-08-03T10:00:00Z"),
    paymentMethod: "cash",
    paymentStatus: "cash_confirmed",
    fulfillmentMethod: "delivery",
    ...overrides,
  };
}

describe("bucketOrders", () => {
  it("buckets by day and fills empty days with zero-count rows", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-03T00:00:00Z");
    const orders = [makeOrder({ createdAt: new Date("2026-08-01T09:00:00Z"), grandTotal: money(1000) }), makeOrder({ createdAt: new Date("2026-08-01T15:00:00Z"), grandTotal: money(2000) })];

    const buckets = bucketOrders(orders, from, to, "day");
    expect(buckets).toHaveLength(3);
    expect(buckets[0]!.periodLabel).toBe("2026-08-01");
    expect(buckets[0]!.orderCount).toBe(2);
    expect(buckets[0]!.revenue).toEqual(money(3000));
    expect(buckets[1]!.orderCount).toBe(0);
    expect(buckets[2]!.orderCount).toBe(0);
  });

  it("excludes pending_payment and cancelled orders from the bucket totals", () => {
    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-01T00:00:00Z");
    const createdAt = new Date("2026-08-01T09:00:00Z");
    const orders = [
      makeOrder({ status: "confirmed", grandTotal: money(1000), createdAt }),
      makeOrder({ status: "pending_payment", grandTotal: money(9999), createdAt }),
      makeOrder({ status: "cancelled", grandTotal: money(9999), createdAt }),
    ];

    const buckets = bucketOrders(orders, from, to, "day");
    expect(buckets).toHaveLength(1);
    expect(buckets[0]!.orderCount).toBe(1);
    expect(buckets[0]!.revenue).toEqual(money(1000));
  });

  it("buckets by month using the 1st-of-month as the period start", () => {
    const from = new Date("2026-07-15T00:00:00Z");
    const to = new Date("2026-08-15T00:00:00Z");
    const orders = [makeOrder({ createdAt: new Date("2026-07-20T00:00:00Z") }), makeOrder({ createdAt: new Date("2026-08-05T00:00:00Z") })];

    const buckets = bucketOrders(orders, from, to, "month");
    expect(buckets.map((bucket) => bucket.periodLabel)).toEqual(["2026-07", "2026-08"]);
    expect(buckets[0]!.orderCount).toBe(1);
    expect(buckets[1]!.orderCount).toBe(1);
  });

  it("buckets by ISO week", () => {
    const from = new Date("2026-08-03T00:00:00Z");
    const to = new Date("2026-08-03T00:00:00Z");
    const buckets = bucketOrders([makeOrder({ createdAt: new Date("2026-08-03T00:00:00Z") })], from, to, "week");
    expect(buckets).toHaveLength(1);
    expect(buckets[0]!.periodLabel).toMatch(/^2026-W\d{2}$/);
  });
});

describe("computeOrdersByStatus", () => {
  it("includes a zero row for every status, even one with no orders", () => {
    const rows = computeOrdersByStatus([{ status: "confirmed" }, { status: "confirmed" }, { status: "cancelled" }]);
    const byStatus = Object.fromEntries(rows.map((row) => [row.status, row.count]));
    expect(byStatus.confirmed).toBe(2);
    expect(byStatus.cancelled).toBe(1);
    expect(byStatus.pending_payment).toBe(0);
    expect(byStatus.completed).toBe(0);
    expect(rows).toHaveLength(7);
  });
});

function makeLine(overrides: Partial<Pick<OrderLine, "productId" | "variantId" | "productName" | "sku" | "quantity" | "lineTotal">> = {}) {
  return { productId: "p1", variantId: null, productName: "Ethiopia Yirgacheffe", sku: "ETH-1", quantity: 1, lineTotal: money(1000), ...overrides };
}

describe("computeCashPaymentsSummary", () => {
  it("splits pending vs confirmed cash orders and tallies delivery/pickup", () => {
    const summary = computeCashPaymentsSummary([
      makeOrder({ paymentMethod: "cash", paymentStatus: "cash_pending", grandTotal: money(1000), fulfillmentMethod: "delivery" }),
      makeOrder({ paymentMethod: "cash", paymentStatus: "cash_pending", grandTotal: money(500), fulfillmentMethod: "pickup" }),
      makeOrder({ paymentMethod: "cash", paymentStatus: "cash_confirmed", grandTotal: money(2000), fulfillmentMethod: "delivery" }),
      makeOrder({ paymentMethod: "tap", paymentStatus: "paid", grandTotal: money(9999) }),
    ]);

    expect(summary.pendingCount).toBe(2);
    expect(summary.pendingTotal).toEqual(money(1500));
    expect(summary.confirmedCount).toBe(1);
    expect(summary.confirmedTotal).toEqual(money(2000));
    expect(summary.deliveryCount).toBe(2);
    expect(summary.pickupCount).toBe(1);
  });

  it("ignores a cancelled cash order that never reached pending or confirmed", () => {
    const summary = computeCashPaymentsSummary([makeOrder({ paymentMethod: "cash", paymentStatus: "cancelled" })]);
    expect(summary.pendingCount).toBe(0);
    expect(summary.confirmedCount).toBe(0);
  });
});

describe("computeOnlinePaymentsSummary", () => {
  it("tallies each tap payment status and ignores cash orders", () => {
    const summary = computeOnlinePaymentsSummary([
      makeOrder({ paymentMethod: "tap", paymentStatus: "paid", grandTotal: money(1000) }),
      makeOrder({ paymentMethod: "tap", paymentStatus: "paid", grandTotal: money(500) }),
      makeOrder({ paymentMethod: "tap", paymentStatus: "failed" }),
      makeOrder({ paymentMethod: "tap", paymentStatus: "refunded", grandTotal: money(300) }),
      makeOrder({ paymentMethod: "cash", paymentStatus: "cash_confirmed", grandTotal: money(9999) }),
    ]);

    expect(summary.paidCount).toBe(2);
    expect(summary.paidTotal).toEqual(money(1500));
    expect(summary.failedCount).toBe(1);
    expect(summary.refundedCount).toBe(1);
    expect(summary.refundedTotal).toEqual(money(300));
  });
});

describe("computeBestSellingProducts", () => {
  it("aggregates quantity/revenue across orders and sorts by quantity sold", () => {
    const orders: OrderLinesForReport[] = [
      { status: "confirmed", lines: [makeLine({ productId: "p1", quantity: 2, lineTotal: money(2000) })] },
      { status: "completed", lines: [makeLine({ productId: "p1", quantity: 1, lineTotal: money(1000) }), makeLine({ productId: "p2", productName: "Grinder", sku: "GR-1", quantity: 5, lineTotal: money(5000) })] },
    ];

    const rows = computeBestSellingProducts(orders, 10);
    expect(rows[0]!.productId).toBe("p2");
    expect(rows[0]!.quantitySold).toBe(5);
    expect(rows[1]!.productId).toBe("p1");
    expect(rows[1]!.quantitySold).toBe(3);
    expect(rows[1]!.revenue).toEqual(money(3000));
  });

  it("excludes lines from pending_payment/cancelled orders", () => {
    const orders: OrderLinesForReport[] = [
      { status: "pending_payment", lines: [makeLine({ quantity: 100 })] },
      { status: "cancelled", lines: [makeLine({ quantity: 100 })] },
      { status: "confirmed", lines: [makeLine({ quantity: 1 })] },
    ];

    const rows = computeBestSellingProducts(orders, 10);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.quantitySold).toBe(1);
  });

  it("respects the limit", () => {
    const orders: OrderLinesForReport[] = [
      { status: "confirmed", lines: [makeLine({ productId: "p1" }), makeLine({ productId: "p2" }), makeLine({ productId: "p3" })] },
    ];
    expect(computeBestSellingProducts(orders, 2)).toHaveLength(2);
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestoreReportRepository } from "@/infrastructure/firebase/repositories/firestore-report-repository";

const orders = new FirestoreOrderRepository();
const reports = new FirestoreReportRepository();

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: randomUUID(),
    orderNumber: `ORD-260130-${randomUUID().slice(0, 6).toUpperCase()}`,
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: `ahmed-${randomUUID().slice(0, 6)}@example.com` },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [
      { productId: "product-1", variantId: null, productName: "Ethiopia Yirgacheffe", sku: "ETH-1", imageUrl: null, unitPrice: money(1899), quantity: 2, lineTotal: money(3798) },
    ],
    subtotal: money(3798),
    shippingFee: money(2000),
    discountTotal: money(0),
    grandTotal: money(5798),
    currency: "BHD",
    paymentMethod: "cash",
    paymentStatus: "cash_pending",
    status: "confirmed",
    source: "web",
    idempotencyKey: randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("FirestoreReportRepository (emulator)", () => {
  it("getDashboardCounts() counts orders by status and sums revenue for revenue-counted statuses", async () => {
    const confirmed = makeOrder({ status: "confirmed", grandTotal: money(1000) });
    const cancelled = makeOrder({ status: "cancelled", grandTotal: money(9999) });
    await orders.create(confirmed);
    await orders.create(cancelled);

    const counts = await reports.getDashboardCounts();
    expect(counts.totalOrders).toBeGreaterThanOrEqual(2);
    expect(counts.ordersByStatus.confirmed).toBeGreaterThanOrEqual(1);
    expect(counts.ordersByStatus.cancelled).toBeGreaterThanOrEqual(1);
    // Revenue is a sum across every order ever created by every test in
    // this run (not scoped to this test's own two orders), so this only
    // asserts it's at least what this test's own confirmed order
    // contributed — a real currency total, not a fixture-only slice.
    expect(counts.totalRevenue.amount).toBeGreaterThanOrEqual(1000);
  });

  it("listOrdersForReport() returns only orders within the date range, with the minimal report shape", async () => {
    const inRange = makeOrder({ createdAt: new Date("2026-08-01T12:00:00Z"), status: "confirmed", grandTotal: money(2500) });
    const outOfRange = makeOrder({ createdAt: new Date("2020-01-01T00:00:00Z"), status: "confirmed" });
    // FirestoreOrderRepository.create() always stamps the real write-time
    // via toDoc(order) using the order's own createdAt field, so writing
    // an explicit historical createdAt here is honored as-is.
    await orders.create(inRange);
    await orders.create(outOfRange);

    const rows = await reports.listOrdersForReport(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-01T23:59:59Z"), 500);
    const found = rows.find((row) => row.grandTotal.amount === 2500);
    expect(found).toBeDefined();
    expect(rows.some((row) => row.createdAt.getFullYear() === 2020)).toBe(false);
  });

  it("listOrderLinesForReport() returns each order's lines within the date range", async () => {
    const order = makeOrder({ createdAt: new Date("2026-08-02T12:00:00Z"), status: "completed" });
    await orders.create(order);

    const rows = await reports.listOrderLinesForReport(new Date("2026-08-02T00:00:00Z"), new Date("2026-08-02T23:59:59Z"), 500);
    const found = rows.find((row) => row.lines.some((line) => line.sku === "ETH-1"));
    expect(found).toBeDefined();
  });
});

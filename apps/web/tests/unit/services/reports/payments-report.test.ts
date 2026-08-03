import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { money } from "@/core/money/money";
import type { OrderTrackingDeps } from "@/services/orders/dependencies";
import { getCashPaymentsReport, getOnlinePaymentsReport, getPendingCashCollectionReport } from "@/services/reports/payments-report";
import { makeSession } from "../test-helpers";
import { createMockReportDeps } from "./test-helpers";

function makeOrderTrackingDeps(): OrderTrackingDeps {
  return {
    orders: {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listByCustomer: vi.fn(),
    },
  };
}

describe("getCashPaymentsReport / getOnlinePaymentsReport", () => {
  it("denies an actor without reports:view", async () => {
    const deps = createMockReportDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getCashPaymentsReport(actor, new Date(), new Date(), deps)).rejects.toThrow(ForbiddenError);
    await expect(getOnlinePaymentsReport(actor, new Date(), new Date(), deps)).rejects.toThrow(ForbiddenError);
  });

  it("summarizes cash and online orders separately from the same report scan", async () => {
    const deps = createMockReportDeps();
    deps.reports.listOrdersForReport = async () => [
      { status: "confirmed", grandTotal: money(1000), createdAt: new Date(), paymentMethod: "cash", paymentStatus: "cash_pending", fulfillmentMethod: "delivery" },
      { status: "confirmed", grandTotal: money(2000), createdAt: new Date(), paymentMethod: "tap", paymentStatus: "paid", fulfillmentMethod: "pickup" },
    ];
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });

    const cash = await getCashPaymentsReport(actor, new Date(), new Date(), deps);
    expect(cash.pendingCount).toBe(1);
    expect(cash.pendingTotal).toEqual(money(1000));

    const online = await getOnlinePaymentsReport(actor, new Date(), new Date(), deps);
    expect(online.paidCount).toBe(1);
    expect(online.paidTotal).toEqual(money(2000));
  });
});

describe("getPendingCashCollectionReport", () => {
  it("denies an actor without reports:view", async () => {
    const deps = makeOrderTrackingDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getPendingCashCollectionReport(actor, deps)).rejects.toThrow(ForbiddenError);
  });

  it("queries orders filtered to cash_pending, oldest first, and maps to report rows", async () => {
    const deps = makeOrderTrackingDeps();
    const createdAt = new Date("2026-08-01T09:00:00Z");
    deps.orders.list = vi.fn().mockResolvedValue({
      items: [
        {
          id: "order-1",
          orderNumber: "ORD-260801-ABCDEF",
          customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" },
          fulfillment: { method: "delivery" },
          grandTotal: money(7000),
          createdAt,
        },
      ],
      nextCursor: null,
    });
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });

    const rows = await getPendingCashCollectionReport(actor, deps);

    expect(deps.orders.list).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: "cash_pending", sort: "createdAt", direction: "asc" }));
    expect(rows).toEqual([
      { orderId: "order-1", orderNumber: "ORD-260801-ABCDEF", customerName: "Ahmed Ali", fulfillmentMethod: "delivery", grandTotal: money(7000), createdAt },
    ]);
  });
});

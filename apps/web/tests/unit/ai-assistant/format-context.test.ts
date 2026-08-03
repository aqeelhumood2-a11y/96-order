import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import { formatAssistantContext } from "@/core/ai-assistant/format-context";
import type { AdminAssistantContext } from "@/core/interfaces/ai-assistant-port";

function makeContext(overrides: Partial<AdminAssistantContext> = {}): AdminAssistantContext {
  return {
    dashboard: { totalOrders: 10, totalRevenue: money(50000), ordersByStatus: {} as never },
    recentSales: [],
    ordersByStatus: [{ status: "confirmed", count: 5 }],
    cashPayments: { pendingCount: 2, pendingTotal: money(2000), confirmedCount: 3, confirmedTotal: money(3000), deliveryCount: 4, pickupCount: 1 },
    onlinePayments: { paidCount: 4, paidTotal: money(4000), pendingCount: 0, authorizedCount: 0, failedCount: 1, cancelledCount: 0, refundedCount: 0, refundedTotal: money(0) },
    pendingCashCollection: [],
    ...overrides,
  };
}

describe("formatAssistantContext", () => {
  it("includes dashboard totals, cash/online summaries, and order status counts", () => {
    const text = formatAssistantContext(makeContext());
    expect(text).toContain("Total orders: 10");
    expect(text).toContain("confirmed: 5");
    expect(text).toContain("2 pending");
    expect(text).toContain("3 confirmed");
    expect(text).toContain("4 paid");
    expect(text).toContain("No orders are currently awaiting cash collection.");
  });

  it("lists pending cash collection orders, oldest first, capped at 10 with an overflow note", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      orderId: `order-${index}`,
      orderNumber: `ORD-${index}`,
      customerName: `Customer ${index}`,
      fulfillmentMethod: "pickup" as const,
      grandTotal: money(1000),
      createdAt: new Date(),
    }));
    const text = formatAssistantContext(makeContext({ pendingCashCollection: rows }));
    expect(text).toContain("12 total");
    expect(text).toContain("ORD-0");
    expect(text).toContain("…and 2 more.");
  });
});

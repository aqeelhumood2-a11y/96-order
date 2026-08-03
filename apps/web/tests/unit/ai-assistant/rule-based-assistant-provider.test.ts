import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import { RuleBasedAssistantProvider } from "@/infrastructure/ai/rule-based-assistant-provider";
import type { AdminAssistantContext } from "@/core/interfaces/ai-assistant-port";

const context: AdminAssistantContext = {
  dashboard: { totalOrders: 1, totalRevenue: money(1000), ordersByStatus: {} as never },
  recentSales: [],
  ordersByStatus: [],
  cashPayments: { pendingCount: 0, pendingTotal: money(0), confirmedCount: 0, confirmedTotal: money(0), deliveryCount: 0, pickupCount: 0 },
  onlinePayments: { paidCount: 0, paidTotal: money(0), pendingCount: 0, authorizedCount: 0, failedCount: 0, cancelledCount: 0, refundedCount: 0, refundedTotal: money(0) },
  pendingCashCollection: [],
};

describe("RuleBasedAssistantProvider", () => {
  it("always returns generatedByAI: false with a data snapshot, regardless of the question asked", async () => {
    const provider = new RuleBasedAssistantProvider();
    const result = await provider.answer("anything at all", context);
    expect(result.generatedByAI).toBe(false);
    expect(result.text).toContain("Total orders: 1");
  });
});

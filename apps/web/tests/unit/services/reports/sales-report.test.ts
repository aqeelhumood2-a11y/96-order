import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { money } from "@/core/money/money";
import { getDailySalesReport, getMonthlySalesReport, getWeeklySalesReport } from "@/services/reports/sales-report";
import { makeSession } from "../test-helpers";
import { createMockReportDeps } from "./test-helpers";

describe("sales reports", () => {
  it("denies an actor without reports:view", async () => {
    const deps = createMockReportDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getDailySalesReport(actor, new Date("2026-08-01"), new Date("2026-08-02"), deps)).rejects.toThrow(ForbiddenError);
  });

  it("buckets by day/week/month using the requested engine", async () => {
    const deps = createMockReportDeps();
    deps.reports.listOrdersForReport = async () => [
      {
        status: "confirmed",
        grandTotal: money(1000),
        createdAt: new Date("2026-08-01T00:00:00Z"),
        paymentMethod: "cash",
        paymentStatus: "cash_confirmed",
        fulfillmentMethod: "delivery",
      },
    ];
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });

    const daily = await getDailySalesReport(actor, new Date("2026-08-01"), new Date("2026-08-01"), deps);
    expect(daily[0]!.periodLabel).toBe("2026-08-01");

    const weekly = await getWeeklySalesReport(actor, new Date("2026-08-01"), new Date("2026-08-01"), deps);
    expect(weekly[0]!.periodLabel).toMatch(/^2026-W\d{2}$/);

    const monthly = await getMonthlySalesReport(actor, new Date("2026-08-01"), new Date("2026-08-01"), deps);
    expect(monthly[0]!.periodLabel).toBe("2026-08");
  });
});

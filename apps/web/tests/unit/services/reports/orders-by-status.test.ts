import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { money } from "@/core/money/money";
import { getOrdersByStatusReport } from "@/services/reports/orders-by-status";
import { makeSession } from "../test-helpers";
import { createMockReportDeps } from "./test-helpers";

describe("getOrdersByStatusReport", () => {
  it("denies an actor without reports:view", async () => {
    const deps = createMockReportDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getOrdersByStatusReport(actor, new Date(), new Date(), deps)).rejects.toThrow(ForbiddenError);
  });

  it("returns a count per status, including zero rows", async () => {
    const deps = createMockReportDeps();
    deps.reports.listOrdersForReport = async () => [
      { status: "confirmed", grandTotal: money(1000), createdAt: new Date(), paymentMethod: "cash", paymentStatus: "cash_confirmed", fulfillmentMethod: "delivery" },
      { status: "confirmed", grandTotal: money(1000), createdAt: new Date(), paymentMethod: "cash", paymentStatus: "cash_confirmed", fulfillmentMethod: "delivery" },
    ];
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });

    const rows = await getOrdersByStatusReport(actor, new Date(), new Date(), deps);
    expect(rows).toHaveLength(7);
    expect(rows.find((row) => row.status === "confirmed")?.count).toBe(2);
    expect(rows.find((row) => row.status === "cancelled")?.count).toBe(0);
  });
});

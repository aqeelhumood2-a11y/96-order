import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { money } from "@/core/money/money";
import { getBestSellingProducts } from "@/services/reports/best-selling-products";
import { makeSession } from "../test-helpers";
import { createMockReportDeps } from "./test-helpers";

describe("getBestSellingProducts", () => {
  it("denies an actor without reports:view", async () => {
    const deps = createMockReportDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getBestSellingProducts(actor, new Date(), new Date(), 10, deps)).rejects.toThrow(ForbiddenError);
  });

  it("returns aggregated rows sorted by quantity sold", async () => {
    const deps = createMockReportDeps();
    deps.reports.listOrderLinesForReport = async () => [
      { status: "confirmed", lines: [{ productId: "p1", variantId: null, productName: "Grinder", sku: "GR-1", quantity: 3, lineTotal: money(3000) }] },
    ];
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });

    const rows = await getBestSellingProducts(actor, new Date(), new Date(), 10, deps);
    expect(rows).toEqual([{ productId: "p1", variantId: null, productName: "Grinder", sku: "GR-1", quantitySold: 3, revenue: money(3000) }]);
  });
});

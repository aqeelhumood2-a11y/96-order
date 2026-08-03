import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { money } from "@/core/money/money";
import type { DashboardDeps } from "@/services/dashboard/dependencies";
import { getDashboardStats } from "@/services/dashboard/get-dashboard-stats";
import { makeSession } from "../test-helpers";

function createDeps(): DashboardDeps {
  return {
    reports: {
      getDashboardCounts: vi.fn().mockResolvedValue({
        totalOrders: 10,
        totalRevenue: money(50000),
        ordersByStatus: { pending_payment: 1, confirmed: 2, preparing: 1, ready: 1, out_for_delivery: 1, completed: 3, cancelled: 1 },
      }),
      listOrdersForReport: vi.fn().mockResolvedValue([]),
      listOrderLinesForReport: vi.fn().mockResolvedValue([]),
    },
    inventory: {
      findByProductAndVariant: vi.fn(),
      listByProduct: vi.fn(),
      listLowStock: vi.fn().mockResolvedValue([]),
      listOutOfStock: vi.fn().mockResolvedValue([]),
      ensureExists: vi.fn(),
      adjust: vi.fn(),
    },
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

describe("getDashboardStats", () => {
  it("denies an actor without dashboard:view", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getDashboardStats(actor, deps)).rejects.toThrow(ForbiddenError);
  });

  it("aggregates counts, inventory alerts, recent orders, and top sellers", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set(["dashboard:view"]) });

    const stats = await getDashboardStats(actor, deps);

    expect(stats.counts.totalOrders).toBe(10);
    expect(stats.counts.totalRevenue).toEqual(money(50000));
    expect(deps.inventory.listLowStock).toHaveBeenCalled();
    expect(deps.inventory.listOutOfStock).toHaveBeenCalled();
    expect(deps.orders.list).toHaveBeenCalledWith(expect.objectContaining({ sort: "createdAt", direction: "desc" }));
    expect(deps.reports.listOrderLinesForReport).toHaveBeenCalled();
    expect(stats.topSellingProducts).toEqual([]);
  });
});

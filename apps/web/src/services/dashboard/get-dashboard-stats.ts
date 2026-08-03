import type { Session } from "@/core/auth/entities";
import type { InventoryRecord } from "@/core/catalog/entities";
import type { DashboardCounts } from "@/core/interfaces/report-repository";
import type { Order } from "@/core/orders/entities";
import type { BestSellingProductRow } from "@/core/reports/entities";
import { computeBestSellingProducts } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { defaultDashboardDeps, type DashboardDeps } from "./dependencies";

const RECENT_ORDERS_LIMIT = 10;
const INVENTORY_ALERT_LIMIT = 10;
const TOP_SELLING_LIMIT = 5;
const TOP_SELLING_WINDOW_DAYS = 30;
const TOP_SELLING_SCAN_LIMIT = 3000;

export interface DashboardStats {
  counts: DashboardCounts;
  lowStock: InventoryRecord[];
  outOfStock: InventoryRecord[];
  recentOrders: Order[];
  /** Best sellers over the trailing `TOP_SELLING_WINDOW_DAYS` days — a fixed, recent window rather than all-time, so the dashboard reflects what's selling *now*. */
  topSellingProducts: BestSellingProductRow[];
}

/**
 * One call for the entire README Dashboard section: order counts by
 * status, revenue, inventory alerts (low/out of stock), recent orders,
 * and top-selling products. `dashboard:view` is its own permission
 * namespace (reserved since Phase 2, unused until now — see
 * `core/auth/permissions.ts#PERMISSION_NAMESPACES`), separate from
 * `reports:view`: a role can see the dashboard's at-a-glance tiles
 * without necessarily having access to the deeper daily/weekly/monthly
 * report drill-downs, or vice versa.
 */
export async function getDashboardStats(actor: Session, deps: DashboardDeps = defaultDashboardDeps): Promise<DashboardStats> {
  requirePermission(actor, "dashboard:view");

  const now = new Date();
  const windowStart = new Date(now.getTime() - TOP_SELLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [counts, lowStock, outOfStock, recentOrdersPage, recentLines] = await Promise.all([
    deps.reports.getDashboardCounts(),
    deps.inventory.listLowStock(INVENTORY_ALERT_LIMIT),
    deps.inventory.listOutOfStock(INVENTORY_ALERT_LIMIT),
    deps.orders.list({ limit: RECENT_ORDERS_LIMIT, sort: "createdAt", direction: "desc" }),
    deps.reports.listOrderLinesForReport(windowStart, now, TOP_SELLING_SCAN_LIMIT),
  ]);

  return {
    counts,
    lowStock,
    outOfStock,
    recentOrders: recentOrdersPage.items,
    topSellingProducts: computeBestSellingProducts(recentLines, TOP_SELLING_LIMIT),
  };
}

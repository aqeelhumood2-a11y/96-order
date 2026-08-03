import type { Money } from "@/core/money/money";
import type { OrderStatus } from "@/core/orders/entities";
import type { OrderForReport, OrderLinesForReport } from "@/core/reports/rules";

export interface DashboardCounts {
  totalOrders: number;
  /** Sum of `grandTotal` across every `countsTowardRevenue` order — see `core/reports/rules.ts`. */
  totalRevenue: Money;
  ordersByStatus: Record<OrderStatus, number>;
}

/**
 * Port for the read-only aggregate queries the dashboard and reporting
 * screens need — deliberately separate from `OrderRepository` (a
 * different concern: analytics over the whole collection, not a single
 * order's CRUD/admin-list access), the same "one interface per concern"
 * split `InventoryRepository`/`InventoryAdjustmentRepository`/
 * `InventoryReservationRepository` already establish. `getDashboardCounts`
 * uses Firestore's native aggregation queries (`count()`/`sum()`) so the
 * dashboard's tiles never require pulling every order document into
 * memory; `listOrdersForReport`/`listOrderLinesForReport` are bounded,
 * unpaginated fetches over a caller-supplied date range for the
 * daily/weekly/monthly and best-seller reports (see README's Reporting
 * architecture section for the volume assumption this bound relies on).
 */
export interface ReportRepository {
  getDashboardCounts(): Promise<DashboardCounts>;
  listOrdersForReport(from: Date, to: Date, limit: number): Promise<OrderForReport[]>;
  listOrderLinesForReport(from: Date, to: Date, limit: number): Promise<OrderLinesForReport[]>;
}

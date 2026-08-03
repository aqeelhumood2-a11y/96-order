import type { Session } from "@/core/auth/entities";
import type { SalesBucket } from "@/core/reports/entities";
import { bucketOrders, type ReportPeriod } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { defaultReportDeps, REPORT_SCAN_LIMIT, type ReportDeps } from "./dependencies";

/** Shared engine behind `getDailySalesReport`/`getWeeklySalesReport`/`getMonthlySalesReport` — README's Reporting foundation. */
async function getSalesReport(actor: Session, period: ReportPeriod, from: Date, to: Date, deps: ReportDeps): Promise<SalesBucket[]> {
  requirePermission(actor, "reports:view");
  const orders = await deps.reports.listOrdersForReport(from, to, REPORT_SCAN_LIMIT);
  return bucketOrders(orders, from, to, period);
}

export function getDailySalesReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<SalesBucket[]> {
  return getSalesReport(actor, "day", from, to, deps);
}

export function getWeeklySalesReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<SalesBucket[]> {
  return getSalesReport(actor, "week", from, to, deps);
}

export function getMonthlySalesReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<SalesBucket[]> {
  return getSalesReport(actor, "month", from, to, deps);
}

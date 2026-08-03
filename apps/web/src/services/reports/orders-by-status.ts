import type { Session } from "@/core/auth/entities";
import type { OrdersByStatusRow } from "@/core/reports/entities";
import { computeOrdersByStatus } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { defaultReportDeps, REPORT_SCAN_LIMIT, type ReportDeps } from "./dependencies";

export async function getOrdersByStatusReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<OrdersByStatusRow[]> {
  requirePermission(actor, "reports:view");
  const orders = await deps.reports.listOrdersForReport(from, to, REPORT_SCAN_LIMIT);
  return computeOrdersByStatus(orders);
}

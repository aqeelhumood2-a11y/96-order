import type { Session } from "@/core/auth/entities";
import type { BestSellingProductRow } from "@/core/reports/entities";
import { computeBestSellingProducts } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { defaultReportDeps, REPORT_SCAN_LIMIT, type ReportDeps } from "./dependencies";

export async function getBestSellingProducts(
  actor: Session,
  from: Date,
  to: Date,
  limit: number = 10,
  deps: ReportDeps = defaultReportDeps,
): Promise<BestSellingProductRow[]> {
  requirePermission(actor, "reports:view");
  const orders = await deps.reports.listOrderLinesForReport(from, to, REPORT_SCAN_LIMIT);
  return computeBestSellingProducts(orders, limit);
}

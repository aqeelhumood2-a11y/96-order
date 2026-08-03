import type { Session } from "@/core/auth/entities";
import type { CashPaymentsSummary, OnlinePaymentsSummary, PendingCashCollectionRow } from "@/core/reports/entities";
import { computeCashPaymentsSummary, computeOnlinePaymentsSummary } from "@/core/reports/rules";
import { requirePermission } from "@/services/auth/session";
import { defaultOrderTrackingDeps, type OrderTrackingDeps } from "@/services/orders/dependencies";
import { defaultReportDeps, REPORT_SCAN_LIMIT, type ReportDeps } from "./dependencies";

export async function getCashPaymentsReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<CashPaymentsSummary> {
  requirePermission(actor, "reports:view");
  const orders = await deps.reports.listOrdersForReport(from, to, REPORT_SCAN_LIMIT);
  return computeCashPaymentsSummary(orders);
}

export async function getOnlinePaymentsReport(actor: Session, from: Date, to: Date, deps: ReportDeps = defaultReportDeps): Promise<OnlinePaymentsSummary> {
  requirePermission(actor, "reports:view");
  const orders = await deps.reports.listOrdersForReport(from, to, REPORT_SCAN_LIMIT);
  return computeOnlinePaymentsSummary(orders);
}

/**
 * The live "cash still needs collecting/confirming" worklist — not a
 * date-bucketed history like the two summaries above, so it queries
 * `OrderRepository.list` directly (already indexed on
 * `paymentStatus + createdAt`, see `firestore.indexes.json`) rather than
 * going through `ReportRepository`. Oldest first, so the
 * longest-outstanding order surfaces at the top. Bounded by
 * `REPORT_SCAN_LIMIT`, the same volume assumption every other report in
 * this module relies on.
 */
export async function getPendingCashCollectionReport(
  actor: Session,
  deps: OrderTrackingDeps = defaultOrderTrackingDeps,
): Promise<PendingCashCollectionRow[]> {
  requirePermission(actor, "reports:view");

  const page = await deps.orders.list({
    paymentStatus: "cash_pending",
    sort: "createdAt",
    direction: "asc",
    limit: REPORT_SCAN_LIMIT,
  });

  return page.items.map((order) => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    fulfillmentMethod: order.fulfillment.method,
    grandTotal: order.grandTotal,
    createdAt: order.createdAt,
  }));
}

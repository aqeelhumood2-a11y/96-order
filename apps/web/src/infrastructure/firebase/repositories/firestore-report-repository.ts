import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { ACTIVE_CURRENCY, add, type Money } from "@/core/money/money";
import { ORDER_STATUSES, type OrderStatus } from "@/core/orders/entities";
import type { PaymentMethod, PaymentStatus } from "@/core/payments/entities";
import { countsTowardRevenue, type OrderForReport, type OrderLinesForReport } from "@/core/reports/rules";
import type { DashboardCounts, ReportRepository } from "@/core/interfaces/report-repository";
import { moneyFromDoc, type MoneyDoc } from "../money-mapping";
import { getAdminFirestore } from "../admin";

const COLLECTION = "orders";
const REVENUE_STATUSES: OrderStatus[] = ORDER_STATUSES.filter(countsTowardRevenue);

/**
 * Only the fields this repository's queries ever need — not the full
 * `OrderDoc` shape `FirestoreOrderRepository` reads/writes, since
 * `listOrdersForReport`/`listOrderLinesForReport` are bounded scans that
 * should stay as light as reasonably possible.
 */
interface ReportOrderDoc {
  status: OrderStatus;
  grandTotal: MoneyDoc;
  createdAt: Timestamp;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillment?: { method: "delivery" | "pickup" };
  lines?: { productId: string; variantId: string | null; productName: string; sku: string; quantity: number; lineTotal: MoneyDoc }[];
}

export class FirestoreReportRepository implements ReportRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  /**
   * Order counts use Firestore's native `count()` aggregation (one
   * server-side count per status, never a full document fetch) — the
   * same aggregation query `FirestoreProductRepository.countByCategory`
   * already relies on. `totalRevenue` instead sums `grandTotal` over a
   * bounded in-memory fetch (capped at `REVENUE_SCAN_LIMIT`) rather than a
   * `sum()` aggregation query, for the same pragmatic reason
   * `listLowStock`/`listOutOfStock` filter in memory after a bounded
   * scan — see README's Reporting architecture section for the volume
   * assumption this bound relies on, and Known limitations for what
   * happens beyond it.
   */
  async getDashboardCounts(): Promise<DashboardCounts> {
    const db = this.db();
    const REVENUE_SCAN_LIMIT = 5000;

    const [totalOrdersSnap, statusCountSnaps, revenueSnap] = await Promise.all([
      db.collection(COLLECTION).count().get(),
      Promise.all(ORDER_STATUSES.map((status) => db.collection(COLLECTION).where("status", "==", status).count().get())),
      db.collection(COLLECTION).where("status", "in", REVENUE_STATUSES).select("grandTotal").limit(REVENUE_SCAN_LIMIT).get(),
    ]);

    const ordersByStatus = Object.fromEntries(
      ORDER_STATUSES.map((status, index) => [status, statusCountSnaps[index]!.data().count]),
    ) as Record<OrderStatus, number>;

    const totalRevenue = revenueSnap.docs.reduce<Money>(
      (total, doc) => add(total, moneyFromDoc(doc.data().grandTotal as MoneyDoc)),
      { amount: 0, currency: ACTIVE_CURRENCY.code },
    );

    return { totalOrders: totalOrdersSnap.data().count, totalRevenue, ordersByStatus };
  }

  async listOrdersForReport(from: Date, to: Date, limit: number): Promise<OrderForReport[]> {
    const snap = await this.db()
      .collection(COLLECTION)
      .where("createdAt", ">=", Timestamp.fromDate(from))
      .where("createdAt", "<=", Timestamp.fromDate(to))
      .orderBy("createdAt", "asc")
      .select("status", "grandTotal", "createdAt", "paymentMethod", "paymentStatus", "fulfillment.method")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data() as ReportOrderDoc;
      return {
        status: data.status,
        grandTotal: moneyFromDoc(data.grandTotal),
        createdAt: data.createdAt.toDate(),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        fulfillmentMethod: data.fulfillment?.method ?? "delivery",
      };
    });
  }

  async listOrderLinesForReport(from: Date, to: Date, limit: number): Promise<OrderLinesForReport[]> {
    const snap = await this.db()
      .collection(COLLECTION)
      .where("createdAt", ">=", Timestamp.fromDate(from))
      .where("createdAt", "<=", Timestamp.fromDate(to))
      .orderBy("createdAt", "asc")
      .select("status", "lines")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data() as ReportOrderDoc;
      return {
        status: data.status,
        lines: (data.lines ?? []).map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          sku: line.sku,
          quantity: line.quantity,
          lineTotal: moneyFromDoc(line.lineTotal),
        })),
      };
    });
  }
}

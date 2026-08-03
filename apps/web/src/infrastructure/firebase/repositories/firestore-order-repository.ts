import "server-only";
import type { Firestore, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { ListOrdersRequest, OrderRepository } from "@/core/interfaces/order-repository";
import type { Page } from "@/core/interfaces/repository";
import type { Order, OrderLine } from "@/core/orders/entities";
import { moneyFromDoc, moneyToDoc, type MoneyDoc } from "../money-mapping";
import { reconcileUniqueKeys } from "./catalog-unique-keys";
import { getAdminFirestore } from "../admin";

const COLLECTION = "orders";
const OWNER_KIND = "order";

const SORT_FIELD_PATHS: Record<ListOrdersRequest["sort"], string> = {
  createdAt: "createdAt",
  grandTotal: "grandTotal.amount",
  orderNumber: "orderNumber",
};

interface OrderLineDoc extends Omit<OrderLine, "unitPrice" | "lineTotal"> {
  unitPrice: MoneyDoc;
  lineTotal: MoneyDoc;
}

interface OrderDoc extends Omit<Order, "id" | "lines" | "subtotal" | "shippingFee" | "discountTotal" | "grandTotal" | "createdAt" | "updatedAt" | "cancelledAt" | "completedAt"> {
  lines: OrderLineDoc[];
  subtotal: MoneyDoc;
  shippingFee: MoneyDoc;
  discountTotal: MoneyDoc;
  grandTotal: MoneyDoc;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
}

function toDomain(doc: QueryDocumentSnapshot): Order {
  const data = doc.data() as OrderDoc;
  return {
    ...data,
    id: doc.id,
    lines: data.lines.map((line) => ({ ...line, unitPrice: moneyFromDoc(line.unitPrice), lineTotal: moneyFromDoc(line.lineTotal) })),
    subtotal: moneyFromDoc(data.subtotal),
    shippingFee: moneyFromDoc(data.shippingFee),
    discountTotal: moneyFromDoc(data.discountTotal),
    grandTotal: moneyFromDoc(data.grandTotal),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    cancelledAt: data.cancelledAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
    couponCode: data.couponCode ?? null,
    appliedDiscounts: data.appliedDiscounts ?? [],
  };
}

function toDoc(order: Order): OrderDoc {
  return {
    orderNumber: order.orderNumber,
    customer: order.customer,
    fulfillment: order.fulfillment,
    lines: order.lines.map((line) => ({ ...line, unitPrice: moneyToDoc(line.unitPrice), lineTotal: moneyToDoc(line.lineTotal) })),
    subtotal: moneyToDoc(order.subtotal),
    shippingFee: moneyToDoc(order.shippingFee),
    discountTotal: moneyToDoc(order.discountTotal),
    grandTotal: moneyToDoc(order.grandTotal),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    source: order.source,
    idempotencyKey: order.idempotencyKey,
    customerId: order.customerId,
    searchTokens: order.searchTokens,
    version: order.version,
    createdAt: Timestamp.fromDate(order.createdAt),
    updatedAt: Timestamp.fromDate(order.updatedAt),
    cancelledAt: order.cancelledAt ? Timestamp.fromDate(order.cancelledAt) : undefined,
    completedAt: order.completedAt ? Timestamp.fromDate(order.completedAt) : undefined,
    couponCode: order.couponCode ?? null,
    appliedDiscounts: order.appliedDiscounts ?? [],
  };
}

export class FirestoreOrderRepository implements OrderRepository {
  private db(): Firestore {
    return getAdminFirestore();
  }

  async findById(id: string): Promise<Order | null> {
    const snap = await this.db().collection(COLLECTION).doc(id).get();
    return snap.exists ? toDomain(snap as QueryDocumentSnapshot) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const snap = await this.db().collection(COLLECTION).where("orderNumber", "==", orderNumber).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const snap = await this.db().collection(COLLECTION).where("idempotencyKey", "==", idempotencyKey).limit(1).get();
    return snap.empty ? null : toDomain(snap.docs[0]!);
  }

  /** Throws `ConflictError` if `order.orderNumber` collides with an existing order — the caller (checkout service) generates a fresh order number and retries in that rare case. */
  async create(order: Order): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(order.id);
    await this.db().runTransaction(async (transaction) => {
      await reconcileUniqueKeys(this.db(), transaction, order.id, OWNER_KIND, [{ type: "order-number", value: order.orderNumber }]);
      transaction.set(ref, toDoc(order));
    });
  }

  async update(id: string, patch: Partial<Order>, expectedVersion: number): Promise<void> {
    const ref = this.db().collection(COLLECTION).doc(id);
    await this.db().runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new NotFoundError("Order not found.");

      const current = toDomain(snap as QueryDocumentSnapshot);
      if (current.version !== expectedVersion) {
        throw new ConflictError("This order was changed by someone else. Reload and try again.");
      }

      const next: Order = { ...current, ...patch, version: current.version + 1, updatedAt: new Date() };
      transaction.set(ref, toDoc(next));
    });
  }

  /**
   * The admin order-management list. `request.search` is expected to
   * already be a single Firestore-ready token (the caller,
   * `services/orders/list-orders.ts`, does the primary-word selection and
   * in-memory multi-word refinement — this method only ever issues one
   * bounded query). `dateFrom`/`dateTo` add a range filter on `createdAt`,
   * which forces `orderBy("createdAt", ...)` regardless of `request.sort`
   * — Firestore requires the first `orderBy` to match a query's one
   * inequality field; `services/orders/list-orders.ts` documents this
   * constraint to callers.
   */
  async list(request: ListOrdersRequest): Promise<Page<Order>> {
    let query: Query = this.db().collection(COLLECTION);

    if (request.status) query = query.where("status", "==", request.status);
    if (request.paymentStatus) query = query.where("paymentStatus", "==", request.paymentStatus);
    if (request.fulfillmentMethod) query = query.where("fulfillment.method", "==", request.fulfillmentMethod);
    if (request.search) query = query.where("searchTokens", "array-contains", request.search);

    const hasDateRange = request.dateFrom !== undefined || request.dateTo !== undefined;
    if (request.dateFrom) query = query.where("createdAt", ">=", Timestamp.fromDate(request.dateFrom));
    if (request.dateTo) query = query.where("createdAt", "<=", Timestamp.fromDate(request.dateTo));

    const sortField = hasDateRange ? SORT_FIELD_PATHS.createdAt : SORT_FIELD_PATHS[request.sort];
    query = query.orderBy(sortField, request.direction);
    if (sortField !== SORT_FIELD_PATHS.createdAt) {
      // Tie-breaker for deterministic pagination when sorting by a
      // non-unique field (grandTotal/orderNumber ties are otherwise
      // possible, unlike createdAt which is effectively unique).
      query = query.orderBy(SORT_FIELD_PATHS.createdAt, "desc");
    }
    query = query.limit(request.limit);

    if (request.cursor) {
      const cursorDoc = await this.db().collection(COLLECTION).doc(request.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    const items = snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
    const nextCursor = items.length === request.limit ? snap.docs[snap.docs.length - 1]!.id : null;
    return { items, nextCursor };
  }

  async listByCustomer(customerId: string, limit: number): Promise<Order[]> {
    const snap = await this.db().collection(COLLECTION).where("customerId", "==", customerId).orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((doc) => toDomain(doc as QueryDocumentSnapshot));
  }
}

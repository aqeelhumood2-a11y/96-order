import type { FulfillmentMethod } from "@/core/delivery/entities";
import type { NewOrderStatusEvent, Order, OrderStatus, OrderStatusEvent } from "@/core/orders/entities";
import type { OrderSortField, SortDirection } from "@/core/orders/schemas";
import type { PaymentStatus } from "@/core/payments/entities";
import type { Page, PageRequest } from "./repository";

/**
 * Admin order-list filters — see `core/orders/schemas.ts#listOrdersQuerySchema`
 * for the untrusted-input validation that produces this, and
 * `services/orders/list-orders.ts` for the Firestore query-construction
 * constraints (`search`/`dateFrom`/`dateTo` each interact with what `sort`
 * can be, since Firestore only allows one range/array-contains clause and
 * requires the range field to be the first `orderBy`).
 */
export interface ListOrdersRequest extends PageRequest {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentMethod?: FulfillmentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  sort: OrderSortField;
  direction: SortDirection;
}

/**
 * `findByIdempotencyKey` backs checkout submission idempotency: before
 * creating a new order, the service looks up whether this exact
 * idempotency key already produced one and returns that instead of
 * creating a duplicate — see README's Idempotency section.
 */
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
  create(order: Order): Promise<void>;
  /** Optimistic concurrency via `expectedVersion` — throws `ConflictError` on mismatch, mirroring `services/catalog/update-product.ts`'s pattern. */
  update(id: string, patch: Partial<Order>, expectedVersion: number): Promise<void>;
  /** Phase 6: the admin order-management list — filtered, searched, sorted, and cursor-paginated. See `ListOrdersRequest`'s doc comment. */
  list(request: ListOrdersRequest): Promise<Page<Order>>;
  /** Phase 6: every order belonging to one customer, newest first — powers the customer-detail "order history" panel. Not paginated: a single customer's order count is expected to stay small relative to the whole `orders` collection. */
  listByCustomer(customerId: string, limit: number): Promise<Order[]>;
}

/** Port for the append-only `orderEvents` collection — see `AuditLogRepository`'s doc comment for why no update/delete method exists here either. */
export interface OrderEventRepository {
  record(event: NewOrderStatusEvent): Promise<OrderStatusEvent>;
  listByOrder(orderId: string): Promise<OrderStatusEvent[]>;
}

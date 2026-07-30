import type { NewOrderStatusEvent, Order, OrderStatusEvent } from "@/core/orders/entities";

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
}

/** Port for the append-only `orderEvents` collection — see `AuditLogRepository`'s doc comment for why no update/delete method exists here either. */
export interface OrderEventRepository {
  record(event: NewOrderStatusEvent): Promise<OrderStatusEvent>;
  listByOrder(orderId: string): Promise<OrderStatusEvent[]>;
}

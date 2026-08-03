import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import type { OrderEventRepository, OrderRepository } from "@/core/interfaces/order-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";
import { FirestoreOrderEventRepository } from "@/infrastructure/firebase/repositories/firestore-order-event-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { defaultEmailDeps, type EmailDeps } from "@/services/email/dependencies";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "@/services/inventory/dependencies";
import { defaultPaymentDeps, type PaymentDeps } from "@/services/payments/dependencies";

export interface OrderTrackingDeps {
  orders: OrderRepository;
}

export const defaultOrderTrackingDeps: OrderTrackingDeps = {
  orders: new FirestoreOrderRepository(),
};

/**
 * Phase 6: the admin order-management use cases (`list-orders.ts`,
 * `get-order.ts`, `change-order-status.ts`, `confirm-order-payment.ts`,
 * `release-order-reservation.ts`) share this one set of seams — the same
 * "compose each sub-area's own already-defaultable deps" convention
 * `services/checkout/dependencies.ts#CheckoutDeps` established.
 */
export interface OrderManagementDeps {
  orders: OrderRepository;
  orderEvents: OrderEventRepository;
  inventory: InventoryReservationDeps;
  customers: CustomerRepository;
  payments: PaymentDeps;
  email: EmailDeps;
  auditLogs: AuditLogRepository;
}

export const defaultOrderManagementDeps: OrderManagementDeps = {
  orders: new FirestoreOrderRepository(),
  orderEvents: new FirestoreOrderEventRepository(),
  inventory: defaultInventoryReservationDeps,
  customers: new FirestoreCustomerRepository(),
  payments: defaultPaymentDeps,
  email: defaultEmailDeps,
  auditLogs: new FirestoreAuditLogRepository(),
};

import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { IdempotencyRepository } from "@/core/interfaces/idempotency-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreIdempotencyRepository } from "@/infrastructure/firebase/repositories/firestore-idempotency-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { defaultCartDeps, type CartDeps } from "@/services/cart/dependencies";
import { defaultEmailDeps, type EmailDeps } from "@/services/email/dependencies";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "@/services/inventory/dependencies";
import { defaultPaymentDeps, type PaymentDeps } from "@/services/payments/dependencies";

/**
 * Checkout is the one use case that touches every other Phase 5 seam at
 * once (cart, orders, inventory reservations, payments, email) — this
 * composes each area's own already-defaultable deps rather than
 * flattening them into one long list, so each sub-area's composition root
 * stays the single place its own wiring changes.
 */
export interface CheckoutDeps {
  cart: CartDeps;
  orders: OrderRepository;
  idempotency: IdempotencyRepository;
  inventory: InventoryReservationDeps;
  payments: PaymentDeps;
  email: EmailDeps;
  auditLogs: AuditLogRepository;
}

export const defaultCheckoutDeps: CheckoutDeps = {
  cart: defaultCartDeps,
  orders: new FirestoreOrderRepository(),
  idempotency: new FirestoreIdempotencyRepository(),
  inventory: defaultInventoryReservationDeps,
  payments: defaultPaymentDeps,
  email: defaultEmailDeps,
  auditLogs: new FirestoreAuditLogRepository(),
};

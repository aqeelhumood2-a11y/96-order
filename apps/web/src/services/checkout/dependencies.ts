import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import type { IdempotencyRepository } from "@/core/interfaces/idempotency-repository";
import type { OrderEventRepository, OrderRepository } from "@/core/interfaces/order-repository";
import type { SiteSettingsRepository } from "@/core/interfaces/site-settings-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";
import { FirestoreIdempotencyRepository } from "@/infrastructure/firebase/repositories/firestore-idempotency-repository";
import { FirestoreOrderEventRepository } from "@/infrastructure/firebase/repositories/firestore-order-event-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestoreSiteSettingsRepository } from "@/infrastructure/firebase/repositories/firestore-site-settings-repository";
import { defaultCartDeps, type CartDeps } from "@/services/cart/dependencies";
import { defaultEmailDeps, type EmailDeps } from "@/services/email/dependencies";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "@/services/inventory/dependencies";
import { defaultPaymentDeps, type PaymentDeps } from "@/services/payments/dependencies";
import { defaultPricingDeps, type PricingDeps } from "@/services/pricing/dependencies";

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
  /** Phase 6: records the order's initial `null -> status` status event, so `orderEvents` is a complete history from the very first status the order ever had — see README's Order history section. */
  orderEvents: OrderEventRepository;
  idempotency: IdempotencyRepository;
  inventory: InventoryReservationDeps;
  payments: PaymentDeps;
  email: EmailDeps;
  auditLogs: AuditLogRepository;
  /** Phase 6: folds the new order into its customer aggregate — see `services/customers/upsert-customer-from-order.ts`. */
  customers: CustomerRepository;
  /** Phase 7: coupon/promotion evaluation and redemption — see `services/pricing/*`. */
  pricing: PricingDeps;
  /** Phase 8: gates checkout against `SiteSettings.paymentProviders` — see `core/site-settings/entities.ts#isPaymentMethodEnabled`. */
  siteSettings: SiteSettingsRepository;
}

export const defaultCheckoutDeps: CheckoutDeps = {
  cart: defaultCartDeps,
  orders: new FirestoreOrderRepository(),
  orderEvents: new FirestoreOrderEventRepository(),
  idempotency: new FirestoreIdempotencyRepository(),
  inventory: defaultInventoryReservationDeps,
  payments: defaultPaymentDeps,
  email: defaultEmailDeps,
  auditLogs: new FirestoreAuditLogRepository(),
  customers: new FirestoreCustomerRepository(),
  pricing: defaultPricingDeps,
  siteSettings: new FirestoreSiteSettingsRepository(),
};

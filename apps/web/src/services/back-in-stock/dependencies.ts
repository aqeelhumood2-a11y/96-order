import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { BackInStockRepository } from "@/core/interfaces/back-in-stock-repository";
import type { CustomerAccountRepository } from "@/core/interfaces/customer-account-repository";
import type { EmailPort } from "@/core/interfaces/email-port";
import type { NotificationOutboxRepository } from "@/core/interfaces/notification-outbox-repository";
import type { PublicProductRepository } from "@/core/interfaces/public-product-repository";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreBackInStockRepository } from "@/infrastructure/firebase/repositories/firestore-back-in-stock-repository";
import { FirestoreCustomerAccountRepository } from "@/infrastructure/firebase/repositories/firestore-customer-account-repository";
import { FirestoreNotificationOutboxRepository } from "@/infrastructure/firebase/repositories/firestore-notification-outbox-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { defaultEmailDeps } from "@/services/email/dependencies";
import { defaultStorefrontDeps } from "@/services/storefront/dependencies";

export interface BackInStockDeps {
  subscriptions: BackInStockRepository;
  notificationOutbox: NotificationOutboxRepository;
  products: PublicProductRepository;
  accounts: CustomerAccountRepository;
  email: EmailPort;
  rateLimiter: RateLimiter;
  auditLogs: AuditLogRepository;
}

/**
 * `email` reuses `defaultEmailDeps.email` — the same SMTP-if-configured,
 * console-otherwise selection every other transactional send goes
 * through (see `services/email/dependencies.ts`) — rather than hardcoding
 * `ConsoleEmailProvider` directly, so a real deployment's back-in-stock
 * alerts actually get delivered once `SMTP_*` is set, not just its order/
 * payment emails.
 */
export const defaultBackInStockDeps: BackInStockDeps = {
  subscriptions: new FirestoreBackInStockRepository(),
  notificationOutbox: new FirestoreNotificationOutboxRepository(),
  products: defaultStorefrontDeps.products,
  accounts: new FirestoreCustomerAccountRepository(),
  email: defaultEmailDeps.email,
  rateLimiter: new FirestoreRateLimiter(),
  auditLogs: new FirestoreAuditLogRepository(),
};

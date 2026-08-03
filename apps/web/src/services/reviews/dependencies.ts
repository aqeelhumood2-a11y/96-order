import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CustomerAccountRepository } from "@/core/interfaces/customer-account-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import type { PublicProductRepository } from "@/core/interfaces/public-product-repository";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import type { ReviewAggregateRepository } from "@/core/interfaces/review-aggregate-repository";
import type { ReviewRepository } from "@/core/interfaces/review-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerAccountRepository } from "@/infrastructure/firebase/repositories/firestore-customer-account-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { FirestoreReviewAggregateRepository } from "@/infrastructure/firebase/repositories/firestore-review-aggregate-repository";
import { FirestoreReviewRepository } from "@/infrastructure/firebase/repositories/firestore-review-repository";
import { defaultStorefrontDeps } from "@/services/storefront/dependencies";

export interface ReviewDeps {
  reviews: ReviewRepository;
  aggregates: ReviewAggregateRepository;
  products: PublicProductRepository;
  orders: OrderRepository;
  accounts: CustomerAccountRepository;
  rateLimiter: RateLimiter;
  auditLogs: AuditLogRepository;
}

export const defaultReviewDeps: ReviewDeps = {
  reviews: new FirestoreReviewRepository(),
  aggregates: new FirestoreReviewAggregateRepository(),
  products: defaultStorefrontDeps.products,
  orders: new FirestoreOrderRepository(),
  accounts: new FirestoreCustomerAccountRepository(),
  rateLimiter: new FirestoreRateLimiter(),
  auditLogs: new FirestoreAuditLogRepository(),
};

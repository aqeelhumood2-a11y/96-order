import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CustomerAccountRepository } from "@/core/interfaces/customer-account-repository";
import type { ProductQuestionRepository } from "@/core/interfaces/product-question-repository";
import type { PublicProductRepository } from "@/core/interfaces/public-product-repository";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerAccountRepository } from "@/infrastructure/firebase/repositories/firestore-customer-account-repository";
import { FirestoreProductQuestionRepository } from "@/infrastructure/firebase/repositories/firestore-product-question-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { defaultStorefrontDeps } from "@/services/storefront/dependencies";

export interface QuestionDeps {
  questions: ProductQuestionRepository;
  products: PublicProductRepository;
  accounts: CustomerAccountRepository;
  rateLimiter: RateLimiter;
  auditLogs: AuditLogRepository;
}

export const defaultQuestionDeps: QuestionDeps = {
  questions: new FirestoreProductQuestionRepository(),
  products: defaultStorefrontDeps.products,
  accounts: new FirestoreCustomerAccountRepository(),
  rateLimiter: new FirestoreRateLimiter(),
  auditLogs: new FirestoreAuditLogRepository(),
};

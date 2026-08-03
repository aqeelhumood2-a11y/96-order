import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { AuthSessionPort } from "@/core/interfaces/auth-session-port";
import type { CustomerAccountRepository } from "@/core/interfaces/customer-account-repository";
import type { CustomerEmailVerificationRepository } from "@/core/interfaces/customer-email-verification-repository";
import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirebaseAuthSession } from "@/infrastructure/firebase/auth-session";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCustomerAccountRepository } from "@/infrastructure/firebase/repositories/firestore-customer-account-repository";
import { FirestoreCustomerEmailVerificationRepository } from "@/infrastructure/firebase/repositories/firestore-customer-email-verification-repository";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { defaultEmailDeps, type EmailDeps } from "@/services/email/dependencies";

export interface CustomerAuthDeps {
  accounts: CustomerAccountRepository;
  /** Phase 6's order-derived aggregate — folded into on registration/verification so a newly-registered account's past guest orders become visible; see `services/customer-auth/link-guest-orders.ts`. */
  customers: CustomerRepository;
  emailVerifications: CustomerEmailVerificationRepository;
  authSession: AuthSessionPort;
  rateLimiter: RateLimiter;
  auditLogs: AuditLogRepository;
  email: EmailDeps;
}

export const defaultCustomerAuthDeps: CustomerAuthDeps = {
  accounts: new FirestoreCustomerAccountRepository(),
  customers: new FirestoreCustomerRepository(),
  emailVerifications: new FirestoreCustomerEmailVerificationRepository(),
  authSession: new FirebaseAuthSession(),
  rateLimiter: new FirestoreRateLimiter(),
  auditLogs: new FirestoreAuditLogRepository(),
  email: defaultEmailDeps,
};

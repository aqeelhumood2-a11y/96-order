import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { CouponRepository } from "@/core/interfaces/coupon-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import type { PromotionRepository } from "@/core/interfaces/promotion-repository";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreCouponRepository } from "@/infrastructure/firebase/repositories/firestore-coupon-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestorePromotionRepository } from "@/infrastructure/firebase/repositories/firestore-promotion-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";

export interface PricingDeps {
  coupons: CouponRepository;
  promotions: PromotionRepository;
  orders: OrderRepository;
  auditLogs: AuditLogRepository;
  rateLimiter: RateLimiter;
}

export const defaultPricingDeps: PricingDeps = {
  coupons: new FirestoreCouponRepository(),
  promotions: new FirestorePromotionRepository(),
  orders: new FirestoreOrderRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
  rateLimiter: new FirestoreRateLimiter(),
};

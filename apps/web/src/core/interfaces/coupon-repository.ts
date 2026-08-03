import type { Coupon } from "@/core/coupons/entities";
import type { Page, PageRequest } from "./repository";

export interface CouponRepository {
  /** `code` must already be normalized (`normalizeCouponCode`) — this is a direct doc `get()`, not a query. */
  findByCode(code: string): Promise<Coupon | null>;
  create(coupon: Coupon): Promise<void>;
  update(code: string, patch: Partial<Coupon>): Promise<void>;
  list(request: PageRequest): Promise<Page<Coupon>>;
  /**
   * Transactional, idempotent redemption: increments `usageCount` and
   * records a `couponRedemptions` row keyed by `${code}:${orderId}` inside
   * one Firestore transaction, so retrying the same order id can never
   * double-count and a redemption can never be recorded without the
   * corresponding usage increment (or vice versa). Returns `false` (and
   * writes nothing) if `usageLimit` would be exceeded — the caller treats
   * that as "coupon no longer available", never a hard error, since the
   * limit could have been reached by a concurrent order between
   * validation and this call.
   */
  redeem(code: string, orderId: string, customerEmail: string, discountAmount: number): Promise<boolean>;
  /** Redemptions for one customer identity (email) — powers `perCustomerLimit` enforcement. */
  countRedemptionsByCustomer(code: string, customerEmail: string): Promise<number>;
}

import { isGreaterThanOrEqual, type Money } from "@/core/money/money";
import type { Coupon } from "./entities";

export type CouponRejectionReason = "not_found" | "inactive" | "not_started" | "expired" | "below_minimum" | "usage_limit_reached" | "per_customer_limit_reached" | "first_order_only";

/** Everything checkable without a repository read (existence/active/dates/minimum subtotal) — usage-limit and per-customer/first-order checks need live data and live in `services/coupons/validate-coupon.ts`. */
export function checkCouponEligibility(coupon: Pick<Coupon, "active" | "startsAt" | "endsAt" | "minSubtotal">, subtotal: Money, now: Date): CouponRejectionReason | null {
  if (!coupon.active) return "inactive";
  if (coupon.startsAt && now < coupon.startsAt) return "not_started";
  if (coupon.endsAt && now > coupon.endsAt) return "expired";
  if (coupon.minSubtotal && !isGreaterThanOrEqual(subtotal, coupon.minSubtotal)) return "below_minimum";
  return null;
}

export function describeCouponRejection(reason: CouponRejectionReason): string {
  switch (reason) {
    case "not_found":
      return "This coupon code isn't valid.";
    case "inactive":
      return "This coupon is no longer active.";
    case "not_started":
      return "This coupon isn't active yet.";
    case "expired":
      return "This coupon has expired.";
    case "below_minimum":
      return "Your order doesn't meet this coupon's minimum spend.";
    case "usage_limit_reached":
      return "This coupon has reached its usage limit.";
    case "per_customer_limit_reached":
      return "You've already used this coupon the maximum number of times.";
    case "first_order_only":
      return "This coupon is only valid on your first order.";
  }
}

import { customerKeyFromEmail } from "@/core/customer/rules";
import { checkCouponEligibility, type CouponRejectionReason } from "@/core/coupons/rules";
import { normalizeCouponCode, type Coupon } from "@/core/coupons/entities";
import type { CouponForEvaluation } from "@/core/pricing/apply-discounts";
import type { Money } from "@/core/money/money";
import { defaultPricingDeps, type PricingDeps } from "./dependencies";

export type CouponValidationResult = { ok: true; coupon: Coupon } | { ok: false; reason: CouponRejectionReason };

/**
 * The one place a coupon code is checked against every rule — usage limit,
 * per-customer limit, first-order-only — before its discount is ever
 * computed. `customerEmail: null` (a guest still filling their cart, whose
 * email isn't known yet) skips the two customer-scoped checks; those are
 * re-run with a real email at checkout time (`services/checkout/create-order.ts`),
 * which is the authoritative pass — this function is also what runs there,
 * not a separate lenient copy.
 */
export async function validateCoupon(rawCode: string, subtotal: Money, customerEmail: string | null, deps: PricingDeps = defaultPricingDeps, now: Date = new Date()): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode);
  const coupon = await deps.coupons.findByCode(code);
  if (!coupon) return { ok: false, reason: "not_found" };

  const basicReason = checkCouponEligibility(coupon, subtotal, now);
  if (basicReason) return { ok: false, reason: basicReason };

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "usage_limit_reached" };
  }

  if (customerEmail) {
    const normalizedEmail = customerEmail.trim().toLowerCase();
    if (coupon.perCustomerLimit !== null) {
      const count = await deps.coupons.countRedemptionsByCustomer(code, normalizedEmail);
      if (count >= coupon.perCustomerLimit) return { ok: false, reason: "per_customer_limit_reached" };
    }
    if (coupon.firstOrderOnly) {
      const priorOrders = await deps.orders.listByCustomer(customerKeyFromEmail(normalizedEmail), 1);
      if (priorOrders.length > 0) return { ok: false, reason: "first_order_only" };
    }
  }

  return { ok: true, coupon };
}

export function toEvaluableCoupon(coupon: Coupon): CouponForEvaluation {
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    scope: coupon.scope,
    excludedProductIds: coupon.excludedProductIds,
    excludedCategoryIds: coupon.excludedCategoryIds,
    maxDiscountCap: coupon.maxDiscountCap,
    stackable: coupon.stackable,
  };
}

import { add, formatMoney, isGreaterThan, isZero, money, positiveDifference, ZERO_BHD, type Money } from "@/core/money/money";

/**
 * The approved Bahrain shipping tiers (Phase 5 scope — see README's
 * Shipping calculations section). All three thresholds/fees are
 * `Money` (integer fils), never a float, and the boundary is always
 * strict ("above X"), not "at or above X" — a cart sitting at exactly
 * BHD 10.000 or exactly BHD 30.000 falls into the *lower* tier, not the
 * next one up. `computeFreeShippingUpsell` below is derived from the same
 * `computeShippingFee` this uses, so the two can never disagree at a
 * boundary.
 */
export const FREE_SHIPPING_THRESHOLD: Money = money(30_000); // BHD 30.000
export const REDUCED_SHIPPING_THRESHOLD: Money = money(10_000); // BHD 10.000
export const STANDARD_SHIPPING_FEE: Money = money(2_000); // BHD 2.000
export const REDUCED_SHIPPING_FEE: Money = money(1_500); // BHD 1.500
const ONE_FILS: Money = money(1);

export function computeShippingFee(subtotal: Money): Money {
  if (isGreaterThan(subtotal, FREE_SHIPPING_THRESHOLD)) return ZERO_BHD;
  if (isGreaterThan(subtotal, REDUCED_SHIPPING_THRESHOLD)) return REDUCED_SHIPPING_FEE;
  return STANDARD_SHIPPING_FEE;
}

export interface FreeShippingUpsell {
  achieved: boolean;
  /** The smallest additional subtotal that would make `computeShippingFee` return zero — `ZERO_BHD` once `achieved` is true. */
  remaining: Money;
}

/**
 * Single-sourced from `computeShippingFee` itself (rather than its own
 * independent `subtotal > FREE_SHIPPING_THRESHOLD` check) so the upsell
 * message and the actual fee can never silently disagree at the boundary.
 * At exactly `FREE_SHIPPING_THRESHOLD`, shipping is still the reduced fee
 * (the rule is strictly "above"), so `remaining` is one fils, not zero —
 * an intentional, documented edge case, not a bug.
 */
export function computeFreeShippingUpsell(subtotal: Money): FreeShippingUpsell {
  const fee = computeShippingFee(subtotal);
  if (isZero(fee)) {
    return { achieved: true, remaining: ZERO_BHD };
  }
  const remaining = add(positiveDifference(FREE_SHIPPING_THRESHOLD, subtotal), ONE_FILS);
  return { achieved: false, remaining };
}

/** `null` once free shipping is already achieved — callers render nothing in that case rather than a "you've already got it" message. */
export function formatFreeShippingUpsellMessage(subtotal: Money): string | null {
  const upsell = computeFreeShippingUpsell(subtotal);
  if (upsell.achieved) return null;
  return `Add ${formatMoney(upsell.remaining)} more to get free delivery`;
}

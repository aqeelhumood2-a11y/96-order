import type { DiscountScope, DiscountType } from "@/core/pricing/discount-engine";
import type { Money } from "@/core/money/money";

/**
 * `code` is the customer-facing identifier and is also this document's
 * Firestore id (uppercased/trimmed — see `normalizeCouponCode`), so a
 * lookup by code is a single `get()`, never a query, and two coupons can
 * never collide on the same code by construction.
 */
export interface Coupon {
  code: string;
  description: string;
  type: DiscountType;
  /** Percent (1-100) for `"percentage"`, minor units for `"fixed"`, ignored for `"free_shipping"`. */
  value: number;
  scope: DiscountScope;
  excludedProductIds: string[];
  excludedCategoryIds: string[];
  minSubtotal: Money | null;
  /** Caps a `"percentage"` discount's amount — ignored for `"fixed"`/`"free_shipping"`. */
  maxDiscountCap: Money | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  /** Total redemptions allowed across every customer combined — `null` means unlimited. */
  usageLimit: number | null;
  /** Denormalized running total, incremented transactionally alongside each `couponRedemptions` write — see `services/coupons/redeem-coupon.ts`. */
  usageCount: number;
  /** Redemptions allowed for one customer identity (email) — `null` means unlimited. */
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
  /** Whether this coupon can combine with an eligible automatic promotion — see `core/pricing/apply-discounts.ts`'s doc comment on stacking rules. */
  stackable: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

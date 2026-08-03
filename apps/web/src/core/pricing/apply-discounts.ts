import { min, sum, type Money } from "@/core/money/money";
import { computeScopedDiscountAmount, lineMatchesScope, type DiscountLineInput, type DiscountScope, type DiscountType } from "./discount-engine";

export interface PromotionForEvaluation {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  priority: number;
  stackable: boolean;
}

export interface CouponForEvaluation {
  code: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  excludedProductIds: string[];
  excludedCategoryIds: string[];
  maxDiscountCap: Money | null;
  stackable: boolean;
}

export interface AppliedDiscount {
  source: "promotion" | "coupon";
  id: string;
  label: string;
  /** Subtotal-value contribution — always `ZERO_BHD` for a pure `"free_shipping"` discount, whose effect is entirely captured by `freeShipping` instead. */
  amount: Money;
  freeShipping: boolean;
}

export interface DiscountResult {
  /** Sum of every applied discount's `amount`, capped so it can never exceed (let alone go negative past) the cart's own subtotal. */
  discountTotal: Money;
  freeShipping: boolean;
  applied: AppliedDiscount[];
}

function isPromotionActiveNow(promotion: PromotionForEvaluation, now: Date): boolean {
  if (!promotion.active) return false;
  if (promotion.startsAt && now < promotion.startsAt) return false;
  if (promotion.endsAt && now > promotion.endsAt) return false;
  return true;
}

function promotionAppliesToAnyLine(promotion: PromotionForEvaluation, lines: readonly DiscountLineInput[]): boolean {
  if (promotion.type === "free_shipping") return true;
  return lines.some((line) => lineMatchesScope(line, promotion.scope, [], []));
}

/**
 * The one place a priced cart's coupon and automatic-promotion effects
 * combine into a final discount, called by both cart display
 * (`services/cart/get-priced-cart.ts`) and checkout
 * (`services/checkout/create-order.ts`) so the two can never disagree.
 *
 * Stacking rules (documented per the Phase 7 spec's requirement):
 *  1. Every *eligible* automatic promotion (active, in date range, scope
 *     matches at least one line) is found first.
 *  2. If any eligible promotion is `stackable: false`, only the single
 *     **lowest-`priority`** one applies — admins rank precedence
 *     explicitly via `priority` rather than the engine guessing which
 *     discount is "biggest"; every other eligible promotion (stackable or
 *     not) is dropped for this cart.
 *  3. Otherwise, every eligible `stackable: true` promotion applies and
 *     their amounts sum.
 *  4. A coupon (already fully validated server-side before this is called
 *     — see `services/coupons/validate-coupon.ts`) then either **adds on
 *     top** of whatever promotions applied (`coupon.stackable: true`) or
 *     **replaces them entirely** (`coupon.stackable: false`) — a
 *     non-stackable coupon is the shopper's explicit choice to use *that*
 *     code instead of whatever automatic promotion would otherwise apply.
 *
 * Free shipping (from a `"free_shipping"`-type promotion or coupon) is
 * reported via `freeShipping`, not folded into `discountTotal` — see
 * `core/shipping/rules.ts` and the checkout pricing pipeline's doc
 * comment for why the shipping *fee* itself is always computed from the
 * pre-discount subtotal, with `freeShipping` applied as a final override.
 */
export function applyDiscounts(
  lines: readonly DiscountLineInput[],
  subtotal: Money,
  promotions: readonly PromotionForEvaluation[],
  coupon: CouponForEvaluation | null,
  now: Date,
): DiscountResult {
  const eligible = promotions.filter((promotion) => isPromotionActiveNow(promotion, now) && promotionAppliesToAnyLine(promotion, lines));
  const nonStackable = eligible.filter((promotion) => !promotion.stackable);

  const selected =
    nonStackable.length > 0
      ? [[...nonStackable].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))[0]!]
      : eligible.filter((promotion) => promotion.stackable);

  let applied: AppliedDiscount[] = selected.map((promotion) => ({
    source: "promotion",
    id: promotion.id,
    label: promotion.name,
    amount: computeScopedDiscountAmount(lines, promotion.type, promotion.value, null, promotion.scope, [], []),
    freeShipping: promotion.type === "free_shipping",
  }));

  if (coupon) {
    const couponDiscount: AppliedDiscount = {
      source: "coupon",
      id: coupon.code,
      label: `Coupon ${coupon.code}`,
      amount: computeScopedDiscountAmount(lines, coupon.type, coupon.value, coupon.maxDiscountCap, coupon.scope, coupon.excludedProductIds, coupon.excludedCategoryIds),
      freeShipping: coupon.type === "free_shipping",
    };
    applied = coupon.stackable ? [...applied, couponDiscount] : [couponDiscount];
  }

  const discountTotal = min(sum(applied.map((discount) => discount.amount)), subtotal);
  const freeShipping = applied.some((discount) => discount.freeShipping);

  return { discountTotal, freeShipping, applied };
}

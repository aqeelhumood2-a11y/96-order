import type { Cart } from "@/core/cart/entities";
import type { PricedCart } from "@/core/cart/rules";
import { applyDiscounts, type CouponForEvaluation, type PromotionForEvaluation } from "@/core/pricing/apply-discounts";
import type { DiscountLineInput } from "@/core/pricing/discount-engine";
import { applyDiscountsToPricedCart, type DiscountedPricedCart } from "@/core/pricing/priced-cart";
import { defaultPricingDeps, type PricingDeps } from "./dependencies";
import { toEvaluableCoupon, validateCoupon } from "./validate-coupon";

function toEvaluablePromotion(promotion: Awaited<ReturnType<PricingDeps["promotions"]["listActive"]>>[number]): PromotionForEvaluation {
  return {
    id: promotion.id,
    name: promotion.name,
    type: promotion.type,
    value: promotion.value,
    scope: promotion.scope,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    active: promotion.active,
    priority: promotion.priority,
    stackable: promotion.stackable,
  };
}

/**
 * Applies the cart's stored `couponCode` (if any) plus every eligible
 * automatic promotion on top of an already-`priceCart`-priced cart —
 * called by both cart display (`services/cart/get-priced-cart.ts`) and
 * checkout (`services/checkout/create-order.ts`) so the shopper sees
 * exactly the total they're about to be charged. A coupon that's no
 * longer valid (expired, limit reached since it was applied, …) is
 * silently dropped from the computed total here rather than surfaced as
 * an error — `features/cart/actions.ts#applyCouponAction` is where an
 * invalid *new* code is rejected with a reason.
 */
export async function evaluateCartDiscounts(priced: PricedCart, cart: Cart, customerEmail: string | null, deps: PricingDeps = defaultPricingDeps): Promise<DiscountedPricedCart> {
  const lines: DiscountLineInput[] = priced.lines
    .filter((line): line is typeof line & { snapshot: NonNullable<typeof line.snapshot> } => line.snapshot !== undefined && line.effectiveQuantity > 0)
    .map((line) => ({ productId: line.line.productId, categoryIds: line.snapshot.categoryIds, brandId: line.snapshot.brandId, lineTotal: line.lineTotal }));

  const activePromotions = await deps.promotions.listActive();
  const promotionsForEval = activePromotions.map(toEvaluablePromotion);

  let couponForEval: CouponForEvaluation | null = null;
  if (cart.couponCode) {
    const result = await validateCoupon(cart.couponCode, priced.subtotal, customerEmail, deps);
    if (result.ok) couponForEval = toEvaluableCoupon(result.coupon);
  }

  const discounts = applyDiscounts(lines, priced.subtotal, promotionsForEval, couponForEval, new Date());
  return applyDiscountsToPricedCart(priced, discounts);
}

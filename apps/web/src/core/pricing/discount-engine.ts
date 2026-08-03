import { isZero, min, money, percentageOf, sum, ZERO_BHD, type Money } from "@/core/money/money";

export const DISCOUNT_TYPES = ["percentage", "fixed", "free_shipping"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** Empty `categoryIds`/`brandIds` means store-wide (every line matches); a non-empty scope matches a line whose category OR brand is included. Shared by both coupons and promotions — see `core/coupons/entities.ts` and `core/promotions/entities.ts`. */
export interface DiscountScope {
  categoryIds: string[];
  brandIds: string[];
}

export interface DiscountLineInput {
  productId: string;
  categoryIds: string[];
  brandId: string | null;
  lineTotal: Money;
}

export function lineMatchesScope(
  line: DiscountLineInput,
  scope: DiscountScope,
  excludedProductIds: readonly string[],
  excludedCategoryIds: readonly string[],
): boolean {
  if (excludedProductIds.includes(line.productId)) return false;
  if (line.categoryIds.some((categoryId) => excludedCategoryIds.includes(categoryId))) return false;

  const unrestricted = scope.categoryIds.length === 0 && scope.brandIds.length === 0;
  if (unrestricted) return true;

  const categoryMatch = scope.categoryIds.length > 0 && line.categoryIds.some((categoryId) => scope.categoryIds.includes(categoryId));
  const brandMatch = scope.brandIds.length > 0 && line.brandId !== null && scope.brandIds.includes(line.brandId);
  return categoryMatch || brandMatch;
}

/**
 * The one place a `"percentage"`/`"fixed"` discount's monetary amount is
 * computed from scoped-eligible lines — shared by coupon and promotion
 * evaluation so the two can never compute a discount differently for the
 * same scope/type/value. `"free_shipping"` has no subtotal amount (its
 * effect is entirely on the shipping fee, handled by the caller), so this
 * always returns `ZERO_BHD` for that type.
 */
export function computeScopedDiscountAmount(
  lines: readonly DiscountLineInput[],
  type: DiscountType,
  value: number,
  maxCap: Money | null,
  scope: DiscountScope,
  excludedProductIds: readonly string[],
  excludedCategoryIds: readonly string[],
): Money {
  if (type === "free_shipping") return ZERO_BHD;

  const eligible = lines.filter((line) => lineMatchesScope(line, scope, excludedProductIds, excludedCategoryIds));
  const eligibleSubtotal = sum(eligible.map((line) => line.lineTotal));
  if (isZero(eligibleSubtotal)) return ZERO_BHD;

  if (type === "percentage") {
    const raw = percentageOf(eligibleSubtotal, value);
    return maxCap ? min(raw, maxCap) : raw;
  }

  // "fixed" — never discounts more than the eligible lines are actually worth.
  return min(money(value), eligibleSubtotal);
}

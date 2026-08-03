import type { DiscountScope, DiscountType } from "@/core/pricing/discount-engine";

/**
 * Deliberately just three types (percentage/fixed/free-shipping), scoped by
 * category/brand — not a generic rules engine. A future promotion type
 * (e.g. "buy X get Y") is a new `type` value plus a new branch in
 * `services/pricing/evaluate-promotions.ts`, not a redesign of this shape.
 */
export interface Promotion {
  id: string;
  name: string;
  type: DiscountType;
  /** Percent (1-100) for `"percentage"`, minor units for `"fixed"`, ignored for `"free_shipping"`. */
  value: number;
  scope: DiscountScope;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  /** Lower number = evaluated first when picking the single best non-stackable promotion — see `core/pricing/apply-discounts.ts`'s doc comment on stacking rules. */
  priority: number;
  stackable: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

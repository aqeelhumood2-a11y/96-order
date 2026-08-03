import { z } from "zod";
import { DISCOUNT_TYPES } from "@/core/pricing/discount-engine";

const scopeSchema = z.object({
  categoryIds: z.array(z.string().min(1)).default([]),
  brandIds: z.array(z.string().min(1)).default([]),
});

export const couponInputSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters.").max(40),
    description: z.string().trim().max(500).default(""),
    type: z.enum(DISCOUNT_TYPES),
    value: z.number().int().min(0),
    scope: scopeSchema,
    excludedProductIds: z.array(z.string().min(1)).default([]),
    excludedCategoryIds: z.array(z.string().min(1)).default([]),
    minSubtotal: z.number().int().min(0).nullable(),
    maxDiscountCap: z.number().int().min(0).nullable(),
    startsAt: z.coerce.date().nullable(),
    endsAt: z.coerce.date().nullable(),
    active: z.boolean(),
    usageLimit: z.number().int().min(1).nullable(),
    perCustomerLimit: z.number().int().min(1).nullable(),
    firstOrderOnly: z.boolean(),
    stackable: z.boolean(),
  })
  .refine((data) => data.type !== "percentage" || (data.value >= 1 && data.value <= 100), {
    message: "Percentage value must be between 1 and 100.",
    path: ["value"],
  })
  .refine((data) => !data.startsAt || !data.endsAt || data.startsAt < data.endsAt, {
    message: "The start date must be before the end date.",
    path: ["endsAt"],
  });
export type CouponInput = z.infer<typeof couponInputSchema>;

export const redeemCouponSchema = z.object({ code: z.string().trim().min(1).max(40) });
export type RedeemCouponInput = z.infer<typeof redeemCouponSchema>;

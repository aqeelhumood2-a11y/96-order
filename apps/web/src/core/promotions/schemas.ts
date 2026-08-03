import { z } from "zod";
import { DISCOUNT_TYPES } from "@/core/pricing/discount-engine";

const scopeSchema = z.object({
  categoryIds: z.array(z.string().min(1)).default([]),
  brandIds: z.array(z.string().min(1)).default([]),
});

export const promotionInputSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter a name.").max(200),
    type: z.enum(DISCOUNT_TYPES),
    value: z.number().int().min(0),
    scope: scopeSchema,
    startsAt: z.coerce.date().nullable(),
    endsAt: z.coerce.date().nullable(),
    active: z.boolean(),
    priority: z.number().int().min(0),
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
export type PromotionInput = z.infer<typeof promotionInputSchema>;

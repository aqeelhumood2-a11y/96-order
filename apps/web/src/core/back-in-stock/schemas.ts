import { z } from "zod";

export const subscribeBackInStockSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  productId: z.string().min(1),
  variantId: z.string().min(1).nullable(),
});
export type SubscribeBackInStockInput = z.infer<typeof subscribeBackInStockSchema>;

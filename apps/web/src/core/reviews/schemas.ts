import { z } from "zod";
import { MAX_RATING, MIN_RATING } from "./rules";

export const reviewInputSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(MIN_RATING).max(MAX_RATING),
  title: z.string().trim().min(1, "Please add a title.").max(150),
  body: z.string().trim().min(1, "Please add a review.").max(5000),
});
export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const updateReviewSchema = reviewInputSchema.omit({ productId: true });
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const moderateReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "hidden"]),
});
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

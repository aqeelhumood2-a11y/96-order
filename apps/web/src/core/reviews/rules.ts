import type { Review } from "./entities";

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** A customer may only edit/delete their own review while it's still awaiting moderation — once approved/rejected/hidden, only an admin (moderation) can change it. */
export function canCustomerModifyReview(review: Pick<Review, "customerUid" | "status">, customerUid: string): boolean {
  return review.customerUid === customerUid && review.status === "pending";
}

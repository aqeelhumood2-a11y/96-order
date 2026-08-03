import type { CustomerSession } from "@/core/customer-auth/entities";
import type { Review } from "@/core/reviews/entities";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

export async function getMyReviewForProduct(session: CustomerSession, productId: string, deps: ReviewDeps = defaultReviewDeps): Promise<Review | null> {
  return deps.reviews.findByCustomerAndProduct(session.uid, productId);
}

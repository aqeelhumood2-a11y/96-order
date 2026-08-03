import type { Page, PageRequest } from "@/core/interfaces/repository";
import type { Review } from "@/core/reviews/entities";
import { averageRating, type ReviewAggregate } from "@/core/reviews/aggregate";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

export interface ProductReviewsView {
  reviews: Page<Review>;
  averageRating: number;
  reviewCount: number;
}

/** Public — approved reviews only, ever. See `ReviewRepository.listApprovedByProduct`'s doc comment. */
export async function listProductReviews(productId: string, request: PageRequest, deps: ReviewDeps = defaultReviewDeps): Promise<ProductReviewsView> {
  const [reviews, aggregate] = await Promise.all([deps.reviews.listApprovedByProduct(productId, request), deps.aggregates.findByProduct(productId)]);
  const resolved: ReviewAggregate | null = aggregate;
  return { reviews, averageRating: averageRating(resolved), reviewCount: resolved?.count ?? 0 };
}

export async function listMyReviews(customerUid: string, deps: ReviewDeps = defaultReviewDeps): Promise<Review[]> {
  return deps.reviews.listByCustomer(customerUid);
}

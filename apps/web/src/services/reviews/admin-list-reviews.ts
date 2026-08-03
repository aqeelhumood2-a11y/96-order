import type { Session } from "@/core/auth/entities";
import type { Page } from "@/core/interfaces/repository";
import type { ListReviewsRequest } from "@/core/interfaces/review-repository";
import type { Review } from "@/core/reviews/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

export async function adminListReviews(actor: Session, request: ListReviewsRequest, deps: ReviewDeps = defaultReviewDeps): Promise<Page<Review>> {
  requirePermission(actor, "reviews:view");
  return deps.reviews.list(request);
}

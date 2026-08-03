import type { CustomerSession } from "@/core/customer-auth/entities";
import { NotFoundError, ValidationError } from "@/core/errors";
import { canCustomerModifyReview } from "@/core/reviews/rules";
import { updateReviewSchema, type UpdateReviewInput } from "@/core/reviews/schemas";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

export async function updateMyReview(session: CustomerSession, reviewId: string, input: UpdateReviewInput, deps: ReviewDeps = defaultReviewDeps): Promise<void> {
  const review = await deps.reviews.findById(reviewId);
  if (!review || review.customerUid !== session.uid) {
    throw new NotFoundError("Review not found.");
  }
  if (!canCustomerModifyReview(review, session.uid)) {
    throw new ValidationError("Only a review awaiting moderation can be edited.");
  }

  const parsed = updateReviewSchema.parse(input);
  await deps.reviews.update(reviewId, { rating: parsed.rating, title: parsed.title, body: parsed.body });
  await deps.auditLogs.record({ type: "review_updated", actorUid: session.uid, actorEmail: session.email, metadata: { productId: review.productId, reviewId } });
}

export async function deleteMyReview(session: CustomerSession, reviewId: string, deps: ReviewDeps = defaultReviewDeps): Promise<void> {
  const review = await deps.reviews.findById(reviewId);
  if (!review || review.customerUid !== session.uid) {
    throw new NotFoundError("Review not found.");
  }
  if (!canCustomerModifyReview(review, session.uid)) {
    throw new ValidationError("Only a review awaiting moderation can be deleted.");
  }

  await deps.reviews.delete(reviewId);
  await deps.auditLogs.record({ type: "review_deleted", actorUid: session.uid, actorEmail: session.email, metadata: { productId: review.productId, reviewId } });
}

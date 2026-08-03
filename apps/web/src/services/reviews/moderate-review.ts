import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { moderateReviewSchema, type ModerateReviewInput } from "@/core/reviews/schemas";
import { requirePermission } from "@/services/auth/session";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

/**
 * The only place a review's aggregate contribution changes — approving
 * adds `rating` to the product's `reviewAggregates` sum/count, moving away
 * from `"approved"` (to `"rejected"`/`"hidden"`) subtracts it, and any
 * transition that doesn't cross the approved boundary (e.g. `"rejected"`
 * -> `"hidden"`, or re-approving an already-`"approved"` review) leaves the
 * aggregate untouched. See `core/interfaces/review-aggregate-repository.ts`.
 */
export async function moderateReview(actor: Session, reviewId: string, input: ModerateReviewInput, deps: ReviewDeps = defaultReviewDeps): Promise<void> {
  requirePermission(actor, "reviews:moderate");
  const parsed = moderateReviewSchema.parse(input);

  const review = await deps.reviews.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Review not found.");
  }

  const wasApproved = review.status === "approved";
  const willBeApproved = parsed.status === "approved";

  await deps.reviews.update(reviewId, { status: parsed.status, moderatedAt: new Date(), moderatedBy: actor.uid });

  if (wasApproved !== willBeApproved) {
    const delta = willBeApproved ? review.rating : -review.rating;
    await deps.aggregates.applyRatingChange(review.productId, delta, willBeApproved ? 1 : -1);
  }

  await deps.auditLogs.record({
    type: "review_moderated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { productId: review.productId, reviewId, status: parsed.status },
  });

  const account = await deps.accounts.findByUid(review.customerUid);
  if (account?.notificationPreferences.reviewStatusChanges) {
    const product = await deps.products.findById(review.productId);
    if (product) {
      await sendTransactionalEmail({ to: account.email, template: "review_status_changed", data: { productName: product.name, status: parsed.status } }).catch(() => undefined);
    }
  }
}

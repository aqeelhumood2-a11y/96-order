import { REVIEW_RATE_LIMITS } from "@/config/reviews";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { ConflictError, NotFoundError, RateLimitedError } from "@/core/errors";
import type { Review } from "@/core/reviews/entities";
import { reviewId } from "@/core/reviews/entities";
import { reviewInputSchema, type ReviewInput } from "@/core/reviews/schemas";
import { hasVerifiedPurchase } from "./verified-purchase";
import { defaultReviewDeps, type ReviewDeps } from "./dependencies";

/** One review per (customer, product) — a second submission is a `ConflictError`, not silently overwritten; the customer edits their existing pending review instead (`update-review.ts`). */
export async function createReview(session: CustomerSession, input: ReviewInput, deps: ReviewDeps = defaultReviewDeps): Promise<Review> {
  const limit = REVIEW_RATE_LIMITS.submitByCustomer;
  const rateResult = await deps.rateLimiter.consume(`review-submit:${session.uid}`, limit.limit, limit.windowSeconds);
  if (!rateResult.allowed) {
    throw new RateLimitedError("Too many reviews submitted. Try again later.", { details: { retryAfterSeconds: rateResult.retryAfterSeconds } });
  }

  const parsed = reviewInputSchema.parse(input);

  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("This product is no longer available.");
  }

  const existing = await deps.reviews.findByCustomerAndProduct(session.uid, parsed.productId);
  if (existing) {
    throw new ConflictError("You've already reviewed this product.");
  }

  const verifiedPurchase = await hasVerifiedPurchase(session.email, parsed.productId, deps.orders);

  const now = new Date();
  const review: Review = {
    id: reviewId(session.uid, parsed.productId),
    productId: parsed.productId,
    customerUid: session.uid,
    customerName: session.displayName,
    rating: parsed.rating,
    title: parsed.title,
    body: parsed.body,
    verifiedPurchase,
    status: "pending",
    imageUrls: [],
    createdAt: now,
    updatedAt: now,
    moderatedAt: null,
    moderatedBy: null,
  };

  await deps.reviews.create(review);
  await deps.auditLogs.record({ type: "review_created", actorUid: session.uid, actorEmail: session.email, metadata: { productId: parsed.productId, reviewId: review.id } });

  return review;
}

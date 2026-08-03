"use client";

import { useState } from "react";
import type { Review } from "@/core/reviews/entities";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { StarRatingDisplay } from "@/features/reviews/components/star-rating-display";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

export interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  /** The signed-in visitor's own review for this product, if any — `undefined` for guests or customers who haven't reviewed it. */
  myReview?: Review | null;
  signedIn: boolean;
}

export function ReviewsSection({ productId, productSlug, reviews, averageRating, reviewCount, myReview, signedIn }: ReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="mt-16 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950">Reviews</h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <StarRatingDisplay rating={averageRating} />
            <span>
              {averageRating} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>

      {signedIn && myReview && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground/70">
            Your review is {myReview.status === "pending" ? "awaiting moderation" : myReview.status}.
          </p>
          {myReview.status === "pending" && (
            <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm((prev) => !prev)}>
              {showForm ? "Cancel" : "Edit your review"}
            </Button>
          )}
        </div>
      )}

      {signedIn && !myReview && (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancel" : "Write a review"}
        </Button>
      )}

      {!signedIn && <p className="text-sm text-foreground/69">Sign in to write a review.</p>}

      {showForm && (
        <ReviewForm productId={productId} productSlug={productSlug} existing={myReview ?? undefined} onDone={() => setShowForm(false)} />
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-foreground/69">No reviews yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-t border-brand-100 pt-4">
              <div className="flex items-center gap-2">
                <StarRatingDisplay rating={review.rating} size="sm" />
                <span className="font-medium text-brand-950">{review.title}</span>
                {review.verifiedPurchase && <Badge variant="success">Verified purchase</Badge>}
              </div>
              <p className="mt-1 text-sm text-foreground/65">{review.customerName}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{review.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

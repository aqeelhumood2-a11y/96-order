"use client";

import { useState } from "react";
import type { Review } from "@/core/reviews/entities";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { StarRatingDisplay } from "@/features/reviews/components/star-rating-display";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
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
  locale?: Locale;
}

export function ReviewsSection({ productId, productSlug, reviews, averageRating, reviewCount, myReview, signedIn, locale = DEFAULT_LOCALE }: ReviewsSectionProps) {
  const dict = getDictionary(locale);
  const reviewsDict = dict.storefront.reviews;
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="mt-16 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950">{reviewsDict.heading}</h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <StarRatingDisplay rating={averageRating} locale={locale} />
            <span>
              {averageRating} ({reviewCount} {reviewCount === 1 ? reviewsDict.reviewSingular : reviewsDict.reviewPlural})
            </span>
          </div>
        )}
      </div>

      {signedIn && myReview && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground/70">
            {reviewsDict.yourReviewStatus.replace(
              "{status}",
              myReview.status === "pending" ? reviewsDict.statusAwaitingModeration : dict.admin.reviewStatus[myReview.status],
            )}
          </p>
          {myReview.status === "pending" && (
            <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm((prev) => !prev)}>
              {showForm ? reviewsDict.cancel : reviewsDict.editYourReview}
            </Button>
          )}
        </div>
      )}

      {signedIn && !myReview && (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? reviewsDict.cancel : reviewsDict.writeAReview}
        </Button>
      )}

      {!signedIn && <p className="text-sm text-foreground/69">{reviewsDict.signInToReview}</p>}

      {showForm && (
        <ReviewForm productId={productId} productSlug={productSlug} existing={myReview ?? undefined} onDone={() => setShowForm(false)} locale={locale} />
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-foreground/69">{reviewsDict.noReviews}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-t border-brand-100 pt-4">
              <div className="flex items-center gap-2">
                <StarRatingDisplay rating={review.rating} size="sm" locale={locale} />
                <span className="font-medium text-brand-950">{review.title}</span>
                {review.verifiedPurchase && <Badge variant="success">{reviewsDict.verifiedPurchase}</Badge>}
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

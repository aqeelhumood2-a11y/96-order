"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewStatus } from "@/core/reviews/entities";
import { moderateReviewAction } from "@/features/reviews/actions";
import { StarRatingDisplay } from "@/features/reviews/components/star-rating-display";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

const STATUS_VARIANT: Record<ReviewStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  hidden: "neutral",
};

export function AdminReviewsTable({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleModerate(id: string, status: "approved" | "rejected" | "hidden") {
    setBusyId(id);
    try {
      await moderateReviewAction(id, { status });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-foreground/69">No reviews yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StarRatingDisplay rating={review.rating} size="sm" />
              <span className="font-medium text-brand-950">{review.title}</span>
              <Badge variant={STATUS_VARIANT[review.status]}>{review.status}</Badge>
              {review.verifiedPurchase && <Badge variant="success">Verified purchase</Badge>}
            </div>
            <span className="text-xs text-foreground/65">{review.createdAt.toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-foreground/65">
            {review.customerName} · product {review.productId}
          </p>
          <p className="whitespace-pre-line text-sm text-foreground/80">{review.body}</p>
          <div className="flex gap-2">
            <Button size="sm" disabled={busyId === review.id || review.status === "approved"} onClick={() => handleModerate(review.id, "approved")}>
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busyId === review.id || review.status === "rejected"} onClick={() => handleModerate(review.id, "rejected")}>
              Reject
            </Button>
            <Button size="sm" variant="outline" disabled={busyId === review.id || review.status === "hidden"} onClick={() => handleModerate(review.id, "hidden")}>
              Hide
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

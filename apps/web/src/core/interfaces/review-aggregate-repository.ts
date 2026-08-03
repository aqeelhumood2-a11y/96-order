import type { ReviewAggregate } from "@/core/reviews/aggregate";

export interface ReviewAggregateRepository {
  findByProduct(productId: string): Promise<ReviewAggregate | null>;
  /** Transactional read-modify-write — applied once per moderation transition that crosses the approved/not-approved boundary (see `services/reviews/moderate-review.ts`), never a full recount over every review. */
  applyRatingChange(productId: string, sumDelta: number, countDelta: number): Promise<void>;
}

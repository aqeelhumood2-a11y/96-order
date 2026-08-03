/**
 * Denormalized per-product rollup — the `reviewAggregates` collection the
 * spec calls for, kept separate from `reviews` so `/products/[slug]`
 * (and every listing card) can read one small doc for "4.3 (12)" instead
 * of scanning/counting the full reviews subset for every page view.
 * `sum`/`count` (not a running average) so moderation transitions can
 * apply an exact incremental delta — see
 * `core/interfaces/review-aggregate-repository.ts`.
 */
export interface ReviewAggregate {
  productId: string;
  sum: number;
  count: number;
  updatedAt: Date;
}

/** Rounded to one decimal place — `4.3`, not `4.333333333333333`. */
export function averageRating(aggregate: Pick<ReviewAggregate, "sum" | "count"> | null): number {
  if (!aggregate || aggregate.count === 0) return 0;
  return Math.round((aggregate.sum / aggregate.count) * 10) / 10;
}

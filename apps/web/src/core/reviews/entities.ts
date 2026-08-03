export const REVIEW_STATUSES = ["pending", "approved", "rejected", "hidden"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/**
 * One row per (customer, product) — deterministic id (`reviewId`) is what
 * "prevent duplicate reviews per customer/product" means structurally: a
 * second submission for the same product overwrites/edits the same
 * document rather than creating a second one, so there is no query-then-
 * check race to get wrong.
 */
export interface Review {
  id: string;
  productId: string;
  customerUid: string;
  /** Denormalized at creation time so `/products/[slug]` can render a byline without a join back to `customerAccounts` (which storefront code has no read access to). */
  customerName: string;
  rating: number;
  title: string;
  body: string;
  /** True if `services/reviews/create-review.ts` found a `"completed"` order containing this product under the reviewer's own email at submission time — never client-supplied. */
  verifiedPurchase: boolean;
  status: ReviewStatus;
  /** Seam only — Phase 7 ships no upload UI for these; see README's Known limitations. */
  imageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  moderatedAt: Date | null;
  moderatedBy: string | null;
}

export function reviewId(customerUid: string, productId: string): string {
  return `${customerUid}:${productId}`;
}

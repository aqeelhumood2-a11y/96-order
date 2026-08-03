import type { Review, ReviewStatus } from "@/core/reviews/entities";
import type { Page, PageRequest } from "./repository";

export interface ListReviewsRequest extends PageRequest {
  status?: ReviewStatus;
}

export interface ReviewRepository {
  findById(id: string): Promise<Review | null>;
  findByCustomerAndProduct(customerUid: string, productId: string): Promise<Review | null>;
  /** `status == "approved"` only — the one method the public storefront is allowed to call. */
  listApprovedByProduct(productId: string, request: PageRequest): Promise<Page<Review>>;
  listByCustomer(customerUid: string): Promise<Review[]>;
  /** `/admin/reviews` — every status, optionally filtered. */
  list(request: ListReviewsRequest): Promise<Page<Review>>;
  create(review: Review): Promise<void>;
  update(id: string, patch: Partial<Review>): Promise<void>;
  delete(id: string): Promise<void>;
}

import type { Promotion } from "@/core/promotions/entities";
import type { Page, PageRequest } from "./repository";

export interface PromotionRepository {
  findById(id: string): Promise<Promotion | null>;
  /** Bounded — `active == true` only, the candidate set `core/pricing/apply-discounts.ts` further narrows by date range and scope. Promotions are expected to stay a small, admin-curated list, never an unbounded scan. */
  listActive(): Promise<Promotion[]>;
  create(promotion: Promotion): Promise<void>;
  update(id: string, patch: Partial<Promotion>): Promise<void>;
  list(request: PageRequest): Promise<Page<Promotion>>;
}

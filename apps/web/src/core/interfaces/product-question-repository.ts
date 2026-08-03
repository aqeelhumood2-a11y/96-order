import type { ProductQuestion, QuestionStatus } from "@/core/questions/entities";
import type { Page, PageRequest } from "./repository";

export interface ListQuestionsRequest extends PageRequest {
  status?: QuestionStatus;
}

export interface ProductQuestionRepository {
  findById(id: string): Promise<ProductQuestion | null>;
  /** `status == "approved"` only — see `core/questions/entities.ts`'s doc comment on why that always means "answered". */
  listApprovedByProduct(productId: string, request: PageRequest): Promise<Page<ProductQuestion>>;
  listByCustomer(customerUid: string): Promise<ProductQuestion[]>;
  /** `/admin/questions` — every status, optionally filtered. */
  list(request: ListQuestionsRequest): Promise<Page<ProductQuestion>>;
  create(question: ProductQuestion): Promise<void>;
  update(id: string, patch: Partial<ProductQuestion>): Promise<void>;
}

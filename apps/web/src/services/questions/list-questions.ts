import type { Session } from "@/core/auth/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import type { ListQuestionsRequest } from "@/core/interfaces/product-question-repository";
import type { ProductQuestion } from "@/core/questions/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultQuestionDeps, type QuestionDeps } from "./dependencies";

/** Public — approved (== answered) questions only. */
export async function listProductQuestions(productId: string, request: PageRequest, deps: QuestionDeps = defaultQuestionDeps): Promise<Page<ProductQuestion>> {
  return deps.questions.listApprovedByProduct(productId, request);
}

export async function adminListQuestions(actor: Session, request: ListQuestionsRequest, deps: QuestionDeps = defaultQuestionDeps): Promise<Page<ProductQuestion>> {
  requirePermission(actor, "questions:view");
  return deps.questions.list(request);
}

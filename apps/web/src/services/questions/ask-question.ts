import { randomUUID } from "node:crypto";
import { QUESTION_RATE_LIMITS } from "@/config/questions";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { NotFoundError, RateLimitedError } from "@/core/errors";
import type { ProductQuestion } from "@/core/questions/entities";
import { askQuestionSchema, type AskQuestionInput } from "@/core/questions/schemas";
import { defaultQuestionDeps, type QuestionDeps } from "./dependencies";

export async function askQuestion(session: CustomerSession, input: AskQuestionInput, deps: QuestionDeps = defaultQuestionDeps): Promise<ProductQuestion> {
  const limit = QUESTION_RATE_LIMITS.askByCustomer;
  const rateResult = await deps.rateLimiter.consume(`question-ask:${session.uid}`, limit.limit, limit.windowSeconds);
  if (!rateResult.allowed) {
    throw new RateLimitedError("Too many questions submitted. Try again later.", { details: { retryAfterSeconds: rateResult.retryAfterSeconds } });
  }

  const parsed = askQuestionSchema.parse(input);
  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("This product is no longer available.");
  }

  const question: ProductQuestion = {
    id: randomUUID(),
    productId: parsed.productId,
    customerUid: session.uid,
    customerName: session.displayName,
    question: parsed.question,
    status: "pending",
    answer: null,
    answeredAt: null,
    answeredBy: null,
    createdAt: new Date(),
  };

  await deps.questions.create(question);
  await deps.auditLogs.record({ type: "product_question_created", actorUid: session.uid, actorEmail: session.email, metadata: { productId: parsed.productId, questionId: question.id } });

  return question;
}

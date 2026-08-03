import { SITE_URL } from "@/config/site";
import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { answerQuestionSchema, type AnswerQuestionInput } from "@/core/questions/schemas";
import { requirePermission } from "@/services/auth/session";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { defaultQuestionDeps, type QuestionDeps } from "./dependencies";

/** Answering *is* approving — see `core/questions/entities.ts`'s doc comment; there's no separate moderation step. */
export async function answerQuestion(actor: Session, questionId: string, input: AnswerQuestionInput, deps: QuestionDeps = defaultQuestionDeps): Promise<void> {
  requirePermission(actor, "questions:answer");
  const parsed = answerQuestionSchema.parse(input);

  const question = await deps.questions.findById(questionId);
  if (!question) {
    throw new NotFoundError("Question not found.");
  }

  await deps.questions.update(questionId, { status: "approved", answer: parsed.answer, answeredAt: new Date(), answeredBy: actor.uid });
  await deps.auditLogs.record({ type: "product_question_answered", actorUid: actor.uid, actorEmail: actor.email, metadata: { productId: question.productId, questionId } });

  const account = await deps.accounts.findByUid(question.customerUid);
  if (account?.notificationPreferences.questionAnswered) {
    const product = await deps.products.findById(question.productId);
    if (product) {
      await sendTransactionalEmail({
        to: account.email,
        template: "product_question_answered",
        data: { productName: product.name, question: question.question, answer: parsed.answer, productUrl: `${SITE_URL}/products/${product.slug}` },
      }).catch(() => undefined);
    }
  }
}

/** A question staff decides isn't fit to publish — no answer text, never shown publicly. */
export async function rejectQuestion(actor: Session, questionId: string, deps: QuestionDeps = defaultQuestionDeps): Promise<void> {
  requirePermission(actor, "questions:answer");
  const question = await deps.questions.findById(questionId);
  if (!question) {
    throw new NotFoundError("Question not found.");
  }
  await deps.questions.update(questionId, { status: "rejected" });
  await deps.auditLogs.record({ type: "product_question_answered", actorUid: actor.uid, actorEmail: actor.email, metadata: { productId: question.productId, questionId, rejected: true } });
}

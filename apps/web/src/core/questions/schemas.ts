import { z } from "zod";

export const askQuestionSchema = z.object({
  productId: z.string().min(1),
  question: z.string().trim().min(1, "Please enter your question.").max(1000),
});
export type AskQuestionInput = z.infer<typeof askQuestionSchema>;

export const answerQuestionSchema = z.object({
  answer: z.string().trim().min(1, "Please enter an answer.").max(2000),
});
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

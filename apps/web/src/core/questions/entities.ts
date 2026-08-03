/**
 * A question's `status` doubles as its moderation state and its answered
 * state — there is no separate "approved but unanswered" state, since the
 * spec's permission model grants only `questions:answer` (no
 * `questions:moderate`), so answering *is* how a staff member approves a
 * question for public display. `"approved"` therefore always has
 * `answer` set; `"pending"` and `"rejected"` never do.
 */
export const QUESTION_STATUSES = ["pending", "approved", "rejected"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export interface ProductQuestion {
  id: string;
  productId: string;
  customerUid: string;
  customerName: string;
  question: string;
  status: QuestionStatus;
  answer: string | null;
  answeredAt: Date | null;
  answeredBy: string | null;
  createdAt: Date;
}

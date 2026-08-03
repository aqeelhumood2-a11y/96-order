export const EMAIL_TEMPLATES = [
  "order_confirmation",
  "payment_confirmation",
  "payment_failure",
  "pickup_confirmation",
  "delivery_confirmation",
  // Phase 7 (customer accounts, CMS, wishlist, reviews, promotions)
  "customer_email_verification",
  "back_in_stock",
  "product_question_answered",
  "review_status_changed",
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

export interface EmailMessage {
  to: string;
  template: EmailTemplate;
  /** Template-specific render data — shape is the sending service's contract with `infrastructure/email`'s template renderer, not enforced by this port. */
  data: Record<string, unknown>;
}

/**
 * `send` never throws — a delivery failure is a normal, expected outcome
 * (`{ sent: false, error }`), not an exception, specifically so a caller
 * can never *accidentally* let an email failure propagate into failing
 * the order/payment flow it's attached to. See
 * `core/interfaces/email-outbox-repository.ts` for the durable retry seam
 * this pairs with, and README's Email delivery/retry seam section.
 */
export interface EmailPort {
  send(message: EmailMessage): Promise<{ sent: boolean; error?: string }>;
}

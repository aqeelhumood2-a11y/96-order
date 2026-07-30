import type { Money } from "@/core/money/money";

export interface CreateChargeInput {
  orderId: string;
  orderNumber: string;
  amount: Money;
  customerEmail: string;
  customerName: string;
  /** Where Tap redirects the shopper's browser after they complete or abandon the hosted payment page. */
  returnUrl: string;
}

export interface CreateChargeResult {
  /** Tap's own charge id — stored as `Payment.providerReference`. */
  providerReference: string;
  /** Tap's hosted payment page — the browser is redirected here, never handed card fields directly by this app. */
  redirectUrl: string;
}

export const NORMALIZED_PAYMENT_STATUSES = ["pending", "authorized", "paid", "failed", "cancelled"] as const;
export type NormalizedPaymentStatus = (typeof NORMALIZED_PAYMENT_STATUSES)[number];

export interface NormalizedWebhookEvent {
  /** The provider's own event id — used as the idempotency key for webhook processing, never regenerated or guessed. */
  eventId: string;
  eventType: string;
  providerReference: string;
  status: NormalizedPaymentStatus;
}

/**
 * The one seam between this app and Tap Payments — `services/payments/*`
 * depends only on this interface, never on the Tap SDK/HTTP API directly
 * (that lives entirely in `infrastructure/payments/tap`). This is what
 * makes `FakeTapProvider` a drop-in for tests/emulator use without any
 * service-layer code knowing the difference. No method here ever accepts
 * or returns raw card data — Tap's hosted page collects it, this app only
 * ever sees a charge id and a status.
 */
export interface PaymentProviderPort {
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  /** Must be called on every webhook delivery before trusting its body — throws or returns `false` on a bad/missing signature, never assumes an unsigned request is legitimate. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent;
  /** Reconciliation path for a webhook that never arrived — fetches the charge's current status directly from the provider. */
  retrieveCharge(providerReference: string): Promise<{ status: NormalizedPaymentStatus }>;
}

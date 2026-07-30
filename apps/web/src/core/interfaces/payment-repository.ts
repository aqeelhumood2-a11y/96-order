import type { Payment, PaymentWebhookEvent } from "@/core/payments/entities";

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByProviderReference(providerReference: string): Promise<Payment | null>;
  create(payment: Payment): Promise<void>;
  update(id: string, patch: Partial<Payment>): Promise<void>;
}

/**
 * Port for the append-only `paymentEvents`/webhook-delivery log — `record`
 * is the idempotency mechanism for webhook processing (see
 * `PaymentWebhookEvent`'s doc comment): the service calls `findById` with
 * the provider's own event id *before* doing anything else, and skips
 * straight to a 200 response if it's already there.
 */
export interface PaymentWebhookEventRepository {
  findById(id: string): Promise<PaymentWebhookEvent | null>;
  record(event: PaymentWebhookEvent): Promise<void>;
  markProcessed(id: string, processedAt: Date): Promise<void>;
}

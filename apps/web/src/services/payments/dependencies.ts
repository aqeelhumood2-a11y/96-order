import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";
import type { PaymentProviderPort } from "@/core/interfaces/payment-provider-port";
import type { PaymentRepository, PaymentWebhookEventRepository } from "@/core/interfaces/payment-repository";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import { FirestorePaymentRepository } from "@/infrastructure/firebase/repositories/firestore-payment-repository";
import { FirestorePaymentWebhookEventRepository } from "@/infrastructure/firebase/repositories/firestore-payment-webhook-event-repository";
import { hasTapCredentials } from "@/infrastructure/payments/tap/env";
import { FakeTapProvider } from "@/infrastructure/payments/tap/fake-tap-provider";
import { TapPaymentProvider } from "@/infrastructure/payments/tap/tap-payment-provider";
import { defaultEmailDeps, type EmailDeps } from "@/services/email/dependencies";
import { defaultInventoryReservationDeps, type InventoryReservationDeps } from "@/services/inventory/dependencies";

export interface PaymentDeps {
  payments: PaymentRepository;
  webhookEvents: PaymentWebhookEventRepository;
  provider: PaymentProviderPort;
  auditLogs: AuditLogRepository;
}

/**
 * `FakeTapProvider` is selected automatically whenever `TAP_SECRET_KEY`
 * isn't configured (always true in this repository's CI/emulator/local-dev
 * runs, since no real Tap credentials are committed — see
 * `infrastructure/payments/tap/env.ts`) so every environment gets a fully
 * working payment provider port without needing live credentials, and a
 * real deployment picks up `TapPaymentProvider` the moment the env var is
 * actually set, with no code change.
 */
export const defaultPaymentDeps: PaymentDeps = {
  payments: new FirestorePaymentRepository(),
  webhookEvents: new FirestorePaymentWebhookEventRepository(),
  provider: hasTapCredentials() ? new TapPaymentProvider() : new FakeTapProvider(),
  auditLogs: new FirestoreAuditLogRepository(),
};

/**
 * Shared by both places that resolve a payment's outcome onto an order —
 * `handle-tap-webhook.ts` (Tap's webhook) and `confirm-cash-payment.ts`
 * (the admin cash-confirmation action) — since both need the same set of
 * seams: the order itself, the inventory reservation lifecycle, and the
 * outgoing confirmation email.
 */
export interface PaymentOrchestrationDeps {
  payments: PaymentDeps;
  orders: OrderRepository;
  inventory: InventoryReservationDeps;
  email: EmailDeps;
}

export const defaultPaymentOrchestrationDeps: PaymentOrchestrationDeps = {
  payments: defaultPaymentDeps,
  orders: new FirestoreOrderRepository(),
  inventory: defaultInventoryReservationDeps,
  email: defaultEmailDeps,
};

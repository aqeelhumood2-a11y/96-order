import { randomUUID } from "node:crypto";
import { ValidationError } from "@/core/errors";
import type { Money } from "@/core/money/money";
import type { Payment, PaymentMethod } from "@/core/payments/entities";
import { defaultPaymentDeps, type PaymentDeps } from "./dependencies";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  amount: Money;
  customerEmail: string;
  customerName: string;
  /** Required (and only used) for `method: "tap"` — where Tap's hosted page redirects back to. */
  returnUrl?: string;
}

export interface CreatePaymentResult {
  payment: Payment;
  /** Present only for `method: "tap"` — the browser must be redirected here to complete payment. */
  redirectUrl?: string;
}

/**
 * Creates the durable `Payment` record for a freshly created order and,
 * for `tap`, opens the actual hosted-checkout session with the provider.
 * `cash` has no provider session at all — its `Payment` starts life at
 * `cash_pending` and only ever changes via the future admin
 * cash-confirmation action (see README's Cash order lifecycle section).
 */
export async function createPayment(input: CreatePaymentInput, deps: PaymentDeps = defaultPaymentDeps): Promise<CreatePaymentResult> {
  const now = new Date();
  const id = randomUUID();

  if (input.method === "cash") {
    const payment: Payment = {
      id,
      orderId: input.orderId,
      method: "cash",
      status: "cash_pending",
      amount: input.amount,
      currency: input.amount.currency,
      createdAt: now,
      updatedAt: now,
    };
    await deps.payments.create(payment);
    return { payment };
  }

  if (!input.returnUrl) {
    throw new ValidationError("A return URL is required to start a card payment.");
  }

  const payment: Payment = {
    id,
    orderId: input.orderId,
    method: "tap",
    status: "pending",
    amount: input.amount,
    currency: input.amount.currency,
    createdAt: now,
    updatedAt: now,
  };
  await deps.payments.create(payment);

  const charge = await deps.provider.createCharge({
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    amount: input.amount,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    returnUrl: input.returnUrl,
  });

  await deps.payments.update(id, { providerReference: charge.providerReference });
  await deps.auditLogs.record({
    type: "payment_started",
    actorUid: null,
    metadata: { orderId: input.orderId, paymentId: id, method: "tap" },
  });

  return { payment: { ...payment, providerReference: charge.providerReference }, redirectUrl: charge.redirectUrl };
}

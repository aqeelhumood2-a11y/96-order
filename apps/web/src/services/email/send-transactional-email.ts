import type { EmailTemplate } from "@/core/interfaces/email-port";
import { defaultEmailDeps, type EmailDeps } from "./dependencies";

export interface SendTransactionalEmailInput {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

/**
 * The one place every checkout/payment/order flow sends a transactional
 * email from — always records the attempt in the durable outbox first
 * (the retry seam, see `core/interfaces/email-outbox-repository.ts`), then
 * makes a best-effort delivery attempt. Never throws: `EmailPort.send`
 * itself can't throw by contract, and a failed send is recorded, not
 * propagated, so an order/payment can always succeed even if email
 * delivery is temporarily down.
 */
export async function sendTransactionalEmail(input: SendTransactionalEmailInput, deps: EmailDeps = defaultEmailDeps): Promise<void> {
  const entry = await deps.outbox.enqueue({ to: input.to, template: input.template, data: input.data });
  const result = await deps.email.send({ to: input.to, template: input.template, data: input.data });

  if (result.sent) {
    await deps.outbox.markSent(entry.id);
  } else {
    await deps.outbox.markFailed(entry.id, result.error ?? "Unknown email delivery error");
  }
}

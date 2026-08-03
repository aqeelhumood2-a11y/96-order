import type { EmailPort } from "@/core/interfaces/email-port";
import type { EmailOutboxRepository } from "@/core/interfaces/email-outbox-repository";
import { ConsoleEmailProvider } from "@/infrastructure/email/console-email-provider";
import { SmtpEmailProvider } from "@/infrastructure/email/smtp-email-provider";
import { hasSmtpCredentials } from "@/infrastructure/email/smtp-env";
import { FirestoreEmailOutboxRepository } from "@/infrastructure/firebase/repositories/firestore-email-outbox-repository";

export interface EmailDeps {
  email: EmailPort;
  outbox: EmailOutboxRepository;
}

/**
 * `SmtpEmailProvider` is selected automatically whenever `SMTP_*` is fully
 * configured (never true in this repository's CI/emulator/local-dev runs,
 * since no real SMTP credentials are committed — see
 * `infrastructure/email/smtp-env.ts`), the same credential-presence
 * pattern `defaultPaymentDeps` established for Tap. Every environment
 * still gets a fully working `EmailPort` with zero configuration
 * (`ConsoleEmailProvider`); a real deployment picks up `SmtpEmailProvider`
 * the moment the env vars are set, with no code change.
 */
export const defaultEmailDeps: EmailDeps = {
  email: hasSmtpCredentials() ? new SmtpEmailProvider() : new ConsoleEmailProvider(),
  outbox: new FirestoreEmailOutboxRepository(),
};

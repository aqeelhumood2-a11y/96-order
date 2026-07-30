import type { EmailPort } from "@/core/interfaces/email-port";
import type { EmailOutboxRepository } from "@/core/interfaces/email-outbox-repository";
import { ConsoleEmailProvider } from "@/infrastructure/email/console-email-provider";
import { FirestoreEmailOutboxRepository } from "@/infrastructure/firebase/repositories/firestore-email-outbox-repository";

export interface EmailDeps {
  email: EmailPort;
  outbox: EmailOutboxRepository;
}

export const defaultEmailDeps: EmailDeps = {
  email: new ConsoleEmailProvider(),
  outbox: new FirestoreEmailOutboxRepository(),
};

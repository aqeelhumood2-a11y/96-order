import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { renderEmailTemplate } from "@/core/email/templates";
import type { EmailMessage, EmailPort } from "@/core/interfaces/email-port";
import { logger } from "@/lib/logger";
import { getSmtpEnv } from "./smtp-env";

let cachedTransporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const env = getSmtpEnv();
  cachedTransporter = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.secure,
    auth: { user: env.user, pass: env.password },
  });
  return cachedTransporter;
}

/**
 * The production `EmailPort` implementation — selected automatically over
 * `ConsoleEmailProvider` whenever `SMTP_*` is fully configured (see
 * `services/email/dependencies.ts` and `infrastructure/email/smtp-env.ts#hasSmtpCredentials`,
 * the same credential-presence selection `defaultPaymentDeps` already
 * establishes for Tap). Vendor-neutral: works with any SMTP-capable ESP.
 *
 * Never throws — matches `EmailPort.send`'s contract exactly (a delivery
 * failure is a normal, expected outcome the caller records via
 * `EmailOutboxRepository`, not an exception that could break an order/
 * payment flow it's attached to).
 */
export class SmtpEmailProvider implements EmailPort {
  async send(message: EmailMessage): Promise<{ sent: boolean; error?: string }> {
    let rendered: { subject: string; text: string };
    try {
      rendered = renderEmailTemplate(message.template, message.data);
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : "Unknown email rendering error" };
    }

    try {
      const env = getSmtpEnv();
      await getTransporter().sendMail({ from: env.from, to: message.to, subject: rendered.subject, text: rendered.text });
      return { sent: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown SMTP delivery error";
      logger.error("SMTP delivery failed", { to: message.to, template: message.template, message: errorMessage });
      return { sent: false, error: errorMessage };
    }
  }
}

import "server-only";
import { renderEmailTemplate } from "@/core/email/templates";
import type { EmailMessage, EmailPort } from "@/core/interfaces/email-port";
import { logger } from "@/lib/logger";

/**
 * Phase 5's only email adapter — logs the fully rendered email instead of
 * delivering it through a real ESP (SendGrid/Postmark/Resend/etc.), which
 * isn't wired up yet. `EmailPort` is the seam a real provider plugs into
 * later without any service-layer code changing — see README's Email
 * delivery/retry seam section.
 */
export class ConsoleEmailProvider implements EmailPort {
  async send(message: EmailMessage): Promise<{ sent: boolean; error?: string }> {
    try {
      const rendered = renderEmailTemplate(message.template, message.data);
      logger.info("Email (console adapter — not actually delivered)", {
        to: message.to,
        template: message.template,
        subject: rendered.subject,
        body: rendered.text,
      });
      return { sent: true };
    } catch (error) {
      return { sent: false, error: error instanceof Error ? error.message : "Unknown email rendering error" };
    }
  }
}

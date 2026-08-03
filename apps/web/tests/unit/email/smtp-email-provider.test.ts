import { afterEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock("nodemailer", () => ({ default: { createTransport } }));

async function importProvider() {
  const imported = await import("@/infrastructure/email/smtp-email-provider");
  return imported.SmtpEmailProvider;
}

describe("SmtpEmailProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    sendMail.mockReset();
    createTransport.mockClear();
  });

  it("sends the rendered subject/text via nodemailer and reports success", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASSWORD", "pass");
    vi.stubEnv("SMTP_FROM", "Ninety Six Degrees Cafe <no-reply@example.com>");
    sendMail.mockResolvedValue({ messageId: "abc" });

    const SmtpEmailProvider = await importProvider();
    const provider = new SmtpEmailProvider();
    const result = await provider.send({ to: "shopper@example.com", template: "payment_confirmation", data: { orderNumber: "ORD-1", amount: { amount: 1899, currency: "BHD" } } });

    expect(result).toEqual({ sent: true });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Ninety Six Degrees Cafe <no-reply@example.com>", to: "shopper@example.com" }),
    );
  });

  it("returns sent: false with the error message when the SMTP transport rejects", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.example.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USER", "user");
    vi.stubEnv("SMTP_PASSWORD", "pass");
    vi.stubEnv("SMTP_FROM", "no-reply@example.com");
    sendMail.mockRejectedValue(new Error("connection refused"));

    const SmtpEmailProvider = await importProvider();
    const provider = new SmtpEmailProvider();
    const result = await provider.send({ to: "shopper@example.com", template: "payment_confirmation", data: { orderNumber: "ORD-1", amount: { amount: 1899, currency: "BHD" } } });

    expect(result).toEqual({ sent: false, error: "connection refused" });
  });
});

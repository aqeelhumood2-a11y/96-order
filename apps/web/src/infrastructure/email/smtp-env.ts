import "server-only";
import { z } from "zod";

const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().min(1),
});

export interface SmtpEnv {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

let cached: SmtpEnv | undefined;

/**
 * Same "throw only when actually used, never at import time" shape as
 * `infrastructure/payments/tap/env.ts#getTapEnv` — see that file's doc
 * comment. Vendor-neutral by design: any SMTP-capable ESP (Amazon SES,
 * SendGrid, Postmark, Mailgun, or even a Gmail account for low-volume
 * testing) works without a dedicated integration, since `SMTP_FROM` is
 * the only ESP-specific value.
 */
export function getSmtpEnv(): SmtpEnv {
  if (cached) return cached;

  const parsed = smtpEnvSchema.safeParse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
  });
  if (!parsed.success) {
    throw new Error("SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM are not fully set — see .env.example.");
  }

  cached = {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    secure: parsed.data.SMTP_SECURE,
    user: parsed.data.SMTP_USER,
    password: parsed.data.SMTP_PASSWORD,
    from: parsed.data.SMTP_FROM,
  };
  return cached;
}

export function hasSmtpCredentials(): boolean {
  return smtpEnvSchema.safeParse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
  }).success;
}

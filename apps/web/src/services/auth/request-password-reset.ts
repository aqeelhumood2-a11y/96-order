import { RATE_LIMITS } from "@/config/auth";
import { RateLimitedError } from "@/core/errors";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface RequestPasswordResetInput {
  email: string;
  ip: string;
}

/**
 * Forgot-password use case. This is the server-side gate only: it
 * rate-limits and audit-logs, then always succeeds so the response never
 * reveals whether an account exists for this email (paired with enabling
 * "Email Enumeration Protection" in the Firebase Auth console). The actual
 * email delivery happens client-side via the Firebase SDK's
 * `sendPasswordResetEmail` immediately after this call succeeds — there is
 * no server-side "send email" API in this stack; Admin SDK's
 * `generatePasswordResetLink` only creates the URL, it doesn't deliver it.
 *
 * Documented limitation: a caller could skip this gate and invoke
 * `sendPasswordResetEmail` directly from the browser, bypassing our rate
 * limit — the same inherent limitation as the login flow. See the Phase 2
 * README's security assumptions.
 */
export async function requestPasswordReset(input: RequestPasswordResetInput, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  const ipLimit = RATE_LIMITS.forgotPasswordByIp;
  const ipResult = await deps.rateLimiter.consume(`forgot-password:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many requests from this network. Try again shortly.", {
      details: { retryAfterSeconds: ipResult.retryAfterSeconds },
    });
  }

  const emailLimit = RATE_LIMITS.forgotPasswordByEmail;
  const emailResult = await deps.rateLimiter.consume(
    `forgot-password:email:${input.email}`,
    emailLimit.limit,
    emailLimit.windowSeconds,
  );
  if (!emailResult.allowed) {
    throw new RateLimitedError("Too many requests for this account. Try again shortly.", {
      details: { retryAfterSeconds: emailResult.retryAfterSeconds },
    });
  }

  await deps.auditLogs.record({
    type: "password_reset_requested",
    actorUid: null,
    actorEmail: input.email,
    metadata: {},
  });
}

import { after } from "next/server";
import { RATE_LIMITS } from "@/config/auth";
import { RateLimitedError } from "@/core/errors";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface RequestPasswordResetInput {
  email: string;
  ip: string;
}

/**
 * Forgot-password use case, fully server-side. Rate-limits by IP and by
 * normalized email, audit-logs the attempt, then triggers Firebase's own
 * hosted password-reset email delivery via `AuthSessionPort.sendPasswordResetEmail`
 * — a server-side call to the same Identity Toolkit endpoint the client
 * SDK uses internally (see infrastructure/firebase/identity-toolkit-rest.ts).
 * The client is never involved in triggering delivery, which is what
 * closes the earlier bypass: previously the client called
 * `sendPasswordResetEmail` itself after this gate succeeded, so a caller
 * could skip the gate and invoke it directly. Now this function is the
 * *only* way delivery happens at all.
 *
 * The send is scheduled via Next.js's `after()` rather than awaited or
 * left as a bare un-awaited promise: awaiting it would leak its latency
 * (and thus whether the account exists) into the response time, but a
 * bare fire-and-forget promise isn't safe on a serverless platform, which
 * can freeze the function as soon as the response is sent and silently
 * drop it mid-flight. `after()` is Next's own guarantee that the platform
 * keeps this invocation alive long enough to finish, without the response
 * waiting for it. The response is always the same generic success,
 * never revealing whether an account exists (pair this with enabling
 * "Email Enumeration Protection" in the Firebase Auth console — see README).
 *
 * The reset link itself is never returned, logged, or recorded anywhere in
 * this codebase — see `AuthSessionPort.sendPasswordResetEmail`'s contract.
 */
export async function requestPasswordReset(input: RequestPasswordResetInput, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const ipLimit = RATE_LIMITS.forgotPasswordByIp;
  const ipResult = await deps.rateLimiter.consume(`forgot-password:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many requests from this network. Try again shortly.", {
      details: { retryAfterSeconds: ipResult.retryAfterSeconds },
    });
  }

  const emailLimit = RATE_LIMITS.forgotPasswordByEmail;
  const emailResult = await deps.rateLimiter.consume(
    `forgot-password:email:${normalizedEmail}`,
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
    actorEmail: normalizedEmail,
    metadata: {},
  });

  // Scheduled after the response, not awaited — see the doc comment above.
  after(() => deps.authSession.sendPasswordResetEmail(normalizedEmail).catch(() => undefined));
}

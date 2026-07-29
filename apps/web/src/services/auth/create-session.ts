import { MINIMUM_LOGIN_RESPONSE_MS, RATE_LIMITS, SESSION_EXPIRES_IN_MS } from "@/config/auth";
import { RateLimitedError, UnauthorizedError } from "@/core/errors";
import { padToMinimumDuration } from "@/lib/timing";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface CreateSessionInput {
  email: string;
  password: string;
  ip: string;
}

export interface CreateSessionResult {
  cookie: string;
  expiresInMs: number;
}

const GENERIC_CREDENTIALS_MESSAGE = "Invalid email or password.";

/**
 * Login use case. The password is verified here, server-side, against
 * Identity Toolkit's REST API (via the AuthSessionPort) — not by the
 * browser calling Firebase directly — specifically so rate limiting runs
 * *before* any password verification is attempted and can't be bypassed by
 * a client that skips our UI. This is also where "only an active staff
 * account may enter the admin area" is enforced: a valid Firebase Auth
 * credential alone isn't authorization.
 *
 * Every failure path — wrong password, unknown email, correct password but
 * not an active staff account, and both rate limits — returns the exact
 * same error (`UnauthorizedError`/`RateLimitedError` with a fixed generic
 * message) and the whole call is padded to a minimum wall-clock duration in
 * `finally`, so neither the response body/status nor its timing reveals
 * which case occurred. The full reason is still recorded in the audit log,
 * which is admin-only, not client-visible.
 */
export async function createSession(input: CreateSessionInput, deps: AuthDeps = defaultAuthDeps): Promise<CreateSessionResult> {
  const startedAt = Date.now();
  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    const ipLimit = RATE_LIMITS.sessionCreateByIp;
    const ipResult = await deps.rateLimiter.consume(`session-create:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
    if (!ipResult.allowed) {
      throw new RateLimitedError("Too many sign-in attempts. Try again shortly.", {
        details: { retryAfterSeconds: ipResult.retryAfterSeconds },
      });
    }

    const emailLimit = RATE_LIMITS.sessionCreateByEmail;
    const emailResult = await deps.rateLimiter.consume(
      `session-create:email:${normalizedEmail}`,
      emailLimit.limit,
      emailLimit.windowSeconds,
    );
    if (!emailResult.allowed) {
      throw new RateLimitedError("Too many sign-in attempts. Try again shortly.", {
        details: { retryAfterSeconds: emailResult.retryAfterSeconds },
      });
    }

    let idToken: string;
    try {
      idToken = (await deps.authSession.signInWithPassword(normalizedEmail, input.password)).idToken;
    } catch (error) {
      await deps.auditLogs.record({
        type: "login_failure",
        actorUid: null,
        actorEmail: normalizedEmail,
        metadata: { reason: "invalid_credentials" },
      });
      throw error;
    }

    const verified = await deps.authSession.verifyIdToken(idToken);
    const user = await deps.users.findByUid(verified.uid);

    if (!user || user.status !== "active") {
      await deps.auditLogs.record({
        type: "login_failure",
        actorUid: verified.uid,
        actorEmail: verified.email,
        metadata: { reason: user ? "deactivated" : "not_staff" },
      });
      throw new UnauthorizedError(GENERIC_CREDENTIALS_MESSAGE);
    }

    const cookie = await deps.authSession.createSessionCookie(idToken, SESSION_EXPIRES_IN_MS);
    await deps.users.recordLogin(user.uid, new Date());
    await deps.auditLogs.record({
      type: "login_success",
      actorUid: user.uid,
      actorEmail: user.email,
      metadata: {},
    });

    return { cookie, expiresInMs: SESSION_EXPIRES_IN_MS };
  } finally {
    await padToMinimumDuration(startedAt, MINIMUM_LOGIN_RESPONSE_MS);
  }
}

import { RATE_LIMITS, SESSION_EXPIRES_IN_MS } from "@/config/auth";
import { ForbiddenError, RateLimitedError } from "@/core/errors";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface CreateSessionInput {
  idToken: string;
  ip: string;
}

export interface CreateSessionResult {
  cookie: string;
  expiresInMs: number;
}

/**
 * Login use case: the client already authenticated with Firebase directly
 * (this never sees a raw password). This turns a valid ID token into a
 * server-managed session cookie — and is also where we enforce that only a
 * staff account with an active `users/{uid}` record may enter the admin
 * area, since a valid Firebase Auth account alone isn't authorization.
 */
export async function createSession(input: CreateSessionInput, deps: AuthDeps = defaultAuthDeps): Promise<CreateSessionResult> {
  const ipLimit = RATE_LIMITS.sessionCreateByIp;
  const ipResult = await deps.rateLimiter.consume(`session-create:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many sign-in attempts from this network. Try again shortly.", {
      details: { retryAfterSeconds: ipResult.retryAfterSeconds },
    });
  }

  const verified = await deps.authSession.verifyIdToken(input.idToken);

  const emailLimit = RATE_LIMITS.sessionCreateByEmail;
  const emailResult = await deps.rateLimiter.consume(
    `session-create:email:${verified.email}`,
    emailLimit.limit,
    emailLimit.windowSeconds,
  );
  if (!emailResult.allowed) {
    throw new RateLimitedError("Too many sign-in attempts for this account. Try again shortly.", {
      details: { retryAfterSeconds: emailResult.retryAfterSeconds },
    });
  }

  const user = await deps.users.findByUid(verified.uid);
  if (!user || user.status !== "active") {
    await deps.auditLogs.record({
      type: "login_failure",
      actorUid: verified.uid,
      actorEmail: verified.email,
      metadata: { reason: user ? "deactivated" : "not_staff" },
    });
    throw new ForbiddenError("This account is not authorized for admin access.");
  }

  const cookie = await deps.authSession.createSessionCookie(input.idToken, SESSION_EXPIRES_IN_MS);
  await deps.users.recordLogin(user.uid, new Date());
  await deps.auditLogs.record({
    type: "login_success",
    actorUid: user.uid,
    actorEmail: user.email,
    metadata: {},
  });

  return { cookie, expiresInMs: SESSION_EXPIRES_IN_MS };
}

import { CUSTOMER_RATE_LIMITS, CUSTOMER_SESSION_EXPIRES_IN_MS, MINIMUM_CUSTOMER_LOGIN_RESPONSE_MS } from "@/config/customer-auth";
import { RateLimitedError, UnauthorizedError } from "@/core/errors";
import { padToMinimumDuration } from "@/lib/timing";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

export interface CustomerLoginInput {
  email: string;
  password: string;
  ip: string;
}

export interface CustomerLoginResult {
  cookie: string;
  expiresInMs: number;
}

const GENERIC_CREDENTIALS_MESSAGE = "Invalid email or password.";

/**
 * Customer login use case — the exact same discipline as
 * `services/auth/create-session.ts` (rate limit before password
 * verification, one generic error/timing for every failure path, real
 * reason only in the audit log), applied to `customerAccounts` instead
 * of `users`. A deactivated account gets the same generic rejection a
 * wrong password does.
 */
export async function loginCustomer(input: CustomerLoginInput, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<CustomerLoginResult> {
  const startedAt = Date.now();
  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    const ipLimit = CUSTOMER_RATE_LIMITS.sessionCreateByIp;
    const ipResult = await deps.rateLimiter.consume(`customer-session-create:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
    if (!ipResult.allowed) {
      throw new RateLimitedError("Too many sign-in attempts. Try again shortly.", { details: { retryAfterSeconds: ipResult.retryAfterSeconds } });
    }

    const emailLimit = CUSTOMER_RATE_LIMITS.sessionCreateByEmail;
    const emailResult = await deps.rateLimiter.consume(`customer-session-create:email:${normalizedEmail}`, emailLimit.limit, emailLimit.windowSeconds);
    if (!emailResult.allowed) {
      throw new RateLimitedError("Too many sign-in attempts. Try again shortly.", { details: { retryAfterSeconds: emailResult.retryAfterSeconds } });
    }

    let idToken: string;
    try {
      idToken = (await deps.authSession.signInWithPassword(normalizedEmail, input.password)).idToken;
    } catch (error) {
      await deps.auditLogs.record({ type: "login_failure", actorUid: null, actorEmail: normalizedEmail, metadata: { reason: "invalid_credentials", actorKind: "customer" } });
      throw error;
    }

    const verified = await deps.authSession.verifyIdToken(idToken);
    const account = await deps.accounts.findByUid(verified.uid);

    if (!account || account.status !== "active") {
      await deps.auditLogs.record({
        type: "login_failure",
        actorUid: verified.uid,
        actorEmail: verified.email,
        metadata: { reason: account ? "deactivated" : "not_customer", actorKind: "customer" },
      });
      throw new UnauthorizedError(GENERIC_CREDENTIALS_MESSAGE);
    }

    const cookie = await deps.authSession.createSessionCookie(idToken, CUSTOMER_SESSION_EXPIRES_IN_MS);
    await deps.accounts.update(account.uid, { lastLoginAt: new Date() });
    await deps.auditLogs.record({ type: "customer_logged_in", actorUid: account.uid, actorEmail: account.email, metadata: {} });

    return { cookie, expiresInMs: CUSTOMER_SESSION_EXPIRES_IN_MS };
  } finally {
    await padToMinimumDuration(startedAt, MINIMUM_CUSTOMER_LOGIN_RESPONSE_MS);
  }
}

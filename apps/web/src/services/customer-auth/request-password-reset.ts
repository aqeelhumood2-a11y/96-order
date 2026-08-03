import { after } from "next/server";
import { CUSTOMER_RATE_LIMITS } from "@/config/customer-auth";
import { requestPasswordResetSchema, type RequestCustomerPasswordResetInput } from "@/core/customer-auth/schemas";
import { RateLimitedError } from "@/core/errors";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

export interface RequestCustomerPasswordResetRequest extends RequestCustomerPasswordResetInput {
  ip: string;
}

/**
 * Reuses Firebase's own hosted password-reset flow
 * (`AuthSessionPort.sendPasswordResetEmail`) — the same one
 * `services/auth/request-password-reset.ts` uses for staff — since it's
 * generic to any Firebase Auth user regardless of which Firestore
 * collection (`users` vs `customerAccounts`) owns the profile. Same
 * `after()`-scheduled send (never awaited in the response path, so
 * delivery latency can't leak whether the account exists) and the same
 * always-generic response as the staff flow — see that file's doc
 * comment for the full rationale.
 */
export async function requestCustomerPasswordReset(input: RequestCustomerPasswordResetRequest, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  const parsed = requestPasswordResetSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();

  const ipLimit = CUSTOMER_RATE_LIMITS.forgotPasswordByIp;
  const ipResult = await deps.rateLimiter.consume(`customer-forgot-password:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many requests from this network. Try again shortly.", { details: { retryAfterSeconds: ipResult.retryAfterSeconds } });
  }

  const emailLimit = CUSTOMER_RATE_LIMITS.forgotPasswordByEmail;
  const emailResult = await deps.rateLimiter.consume(`customer-forgot-password:email:${email}`, emailLimit.limit, emailLimit.windowSeconds);
  if (!emailResult.allowed) {
    throw new RateLimitedError("Too many requests for this account. Try again shortly.", { details: { retryAfterSeconds: emailResult.retryAfterSeconds } });
  }

  await deps.auditLogs.record({ type: "customer_password_reset_requested", actorUid: null, actorEmail: email, metadata: {} });

  after(() => deps.authSession.sendPasswordResetEmail(email).catch(() => undefined));
}

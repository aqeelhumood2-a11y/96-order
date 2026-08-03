import { defaultNotificationPreferences } from "@/core/customer-auth/entities";
import { registerCustomerSchema, type RegisterCustomerInput } from "@/core/customer-auth/schemas";
import { RateLimitedError } from "@/core/errors";
import { CUSTOMER_RATE_LIMITS } from "@/config/customer-auth";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";
import { sendVerificationEmail } from "./send-verification-email";

export interface RegisterCustomerRequest extends RegisterCustomerInput {
  ip: string;
}

/**
 * Customer self-registration. Creates the Firebase Auth user directly
 * with the password they chose (`createUserWithPassword` — unlike staff
 * onboarding's passwordless `createUser`), then the `CustomerAccount`
 * document, then sends the verification email. Does **not** immediately
 * link any past guest orders for this email — that only happens once the
 * email is actually verified (`verify-email.ts` calls
 * `link-guest-orders.ts`), so an unverified registration can never expose
 * someone else's order history just because the email string matches.
 */
export async function registerCustomer(input: RegisterCustomerRequest, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<{ uid: string }> {
  const parsed = registerCustomerSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();

  const ipLimit = CUSTOMER_RATE_LIMITS.registerByIp;
  const ipResult = await deps.rateLimiter.consume(`customer-register:ip:${input.ip}`, ipLimit.limit, ipLimit.windowSeconds);
  if (!ipResult.allowed) {
    throw new RateLimitedError("Too many registration attempts. Try again shortly.", { details: { retryAfterSeconds: ipResult.retryAfterSeconds } });
  }

  const authUser = await deps.authSession.createUserWithPassword(email, parsed.password);

  const now = new Date();
  await deps.accounts.create({
    uid: authUser.uid,
    email,
    displayName: parsed.fullName,
    status: "active",
    emailVerified: false,
    marketingConsent: parsed.marketingConsent,
    marketingConsentUpdatedAt: parsed.marketingConsent ? now : undefined,
    notificationPreferences: defaultNotificationPreferences(),
    createdAt: now,
    updatedAt: now,
  });

  await deps.auditLogs.record({ type: "customer_registered", actorUid: authUser.uid, actorEmail: email, metadata: {} });

  await sendVerificationEmail(authUser.uid, email, deps);

  return { uid: authUser.uid };
}

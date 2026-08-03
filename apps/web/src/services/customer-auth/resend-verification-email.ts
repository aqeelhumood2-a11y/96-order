import { CUSTOMER_RATE_LIMITS } from "@/config/customer-auth";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { RateLimitedError, ValidationError } from "@/core/errors";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";
import { sendVerificationEmail } from "./send-verification-email";

export async function resendCustomerVerificationEmail(session: CustomerSession, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  if (session.emailVerified) {
    throw new ValidationError("This account is already verified.");
  }

  const limit = CUSTOMER_RATE_LIMITS.resendVerificationByEmail;
  const result = await deps.rateLimiter.consume(`customer-resend-verification:${session.uid}`, limit.limit, limit.windowSeconds);
  if (!result.allowed) {
    throw new RateLimitedError("Too many verification emails requested. Try again shortly.", { details: { retryAfterSeconds: result.retryAfterSeconds } });
  }

  await sendVerificationEmail(session.uid, session.email, deps);
}

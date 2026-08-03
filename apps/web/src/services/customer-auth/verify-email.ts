import { hashVerificationToken, isVerificationTokenExpired } from "@/core/customer-auth/rules";
import { ValidationError } from "@/core/errors";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";
import { linkGuestOrders } from "./link-guest-orders";

/**
 * Consumes a one-time verification token from the emailed link. Throws
 * the same `ValidationError` for "no such token," "already used," and
 * "expired" — a caller can't distinguish which, so a probed/guessed
 * token reveals nothing (the same enumeration-resistance discipline
 * `services/orders/track-order.ts` established in Phase 5). Deletes the
 * token immediately on success (single-use) before doing anything else,
 * so a retried/double-clicked link can't re-trigger side effects twice —
 * though `linkGuestOrders`/the account update are themselves idempotent
 * regardless.
 */
export async function verifyCustomerEmail(token: string, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<{ email: string }> {
  const hash = hashVerificationToken(token);
  const record = await deps.emailVerifications.findByTokenHash(hash);
  if (!record || isVerificationTokenExpired(record.expiresAt)) {
    throw new ValidationError("This verification link is invalid or has expired.");
  }

  await deps.emailVerifications.deleteByTokenHash(hash);
  await deps.accounts.update(record.customerUid, { emailVerified: true });
  await linkGuestOrders(record.customerUid, record.email, deps);

  return { email: record.email };
}

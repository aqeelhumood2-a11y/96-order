import { SITE_URL } from "@/config/site";
import { EMAIL_VERIFICATION_TOKEN_TTL_MS, generateVerificationToken } from "@/core/customer-auth/rules";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

/**
 * Issues a fresh one-time verification link and emails it — called from
 * registration and from the customer-triggered "resend" action.
 * Invalidates any earlier still-outstanding token for this account first
 * (`deleteAllForCustomer`), so only the most recently requested link is
 * ever valid.
 */
export async function sendVerificationEmail(uid: string, email: string, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  await deps.emailVerifications.deleteAllForCustomer(uid);

  const { token, hash } = generateVerificationToken();
  const now = new Date();
  await deps.emailVerifications.create({
    tokenHash: hash,
    customerUid: uid,
    email,
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    createdAt: now,
  });

  const verifyUrl = `${SITE_URL}/account/verify-email?token=${token}`;
  await sendTransactionalEmail({ to: email, template: "customer_email_verification", data: { verifyUrl } }, deps.email);
}

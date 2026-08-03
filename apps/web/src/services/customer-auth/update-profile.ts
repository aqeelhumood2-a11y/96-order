import type { CustomerSession } from "@/core/customer-auth/entities";
import { updateCustomerProfileSchema, type UpdateCustomerProfileInput, notificationPreferencesSchema, type UpdateNotificationPreferencesInput, marketingConsentSchema, type UpdateMarketingConsentInput } from "@/core/customer-auth/schemas";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

export async function updateCustomerProfile(session: CustomerSession, input: UpdateCustomerProfileInput, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  const parsed = updateCustomerProfileSchema.parse(input);
  await deps.accounts.update(session.uid, { displayName: parsed.fullName, mobile: parsed.mobile });
  await deps.auditLogs.record({ type: "customer_profile_updated", actorUid: session.uid, actorEmail: session.email, metadata: {} });
}

export async function updateCustomerNotificationPreferences(
  session: CustomerSession,
  input: UpdateNotificationPreferencesInput,
  deps: CustomerAuthDeps = defaultCustomerAuthDeps,
): Promise<void> {
  const parsed = notificationPreferencesSchema.parse(input);
  await deps.accounts.update(session.uid, { notificationPreferences: parsed });
}

/** Marketing consent is tracked separately from the general profile update — see `CustomerAccount.marketingConsent`'s doc comment for why it's treated as a consent record, timestamped on every change. */
export async function updateCustomerMarketingConsent(
  session: CustomerSession,
  input: UpdateMarketingConsentInput,
  deps: CustomerAuthDeps = defaultCustomerAuthDeps,
): Promise<void> {
  const parsed = marketingConsentSchema.parse(input);
  await deps.accounts.update(session.uid, { marketingConsent: parsed.marketingConsent, marketingConsentUpdatedAt: new Date() });
}

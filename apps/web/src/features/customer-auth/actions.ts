"use server";

import { revalidatePath } from "next/cache";
import type { UpdateCustomerProfileInput, UpdateMarketingConsentInput, UpdateNotificationPreferencesInput } from "@/core/customer-auth/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { resendCustomerVerificationEmail } from "@/services/customer-auth/resend-verification-email";
import { updateCustomerMarketingConsent, updateCustomerNotificationPreferences, updateCustomerProfile } from "@/services/customer-auth/update-profile";

export async function resendVerificationEmailAction(): Promise<ActionResult<null>> {
  return runAction(async () => {
    const session = await requireCustomerSession();
    await resendCustomerVerificationEmail(session);
    return null;
  });
}

export async function updateProfileAction(input: UpdateCustomerProfileInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await updateCustomerProfile(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/account/profile");
  return result;
}

export async function updateNotificationPreferencesAction(input: UpdateNotificationPreferencesInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await updateCustomerNotificationPreferences(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/account/notifications");
  return result;
}

export async function updateMarketingConsentAction(input: UpdateMarketingConsentInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await updateCustomerMarketingConsent(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/account/notifications");
  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import type { SiteSettingsInput } from "@/core/site-settings/schemas";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireSession } from "@/services/auth/session";
import { updateSiteSettings } from "@/services/site-settings/manage-settings";

export async function updateSiteSettingsAction(input: SiteSettingsInput): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireSession();
    await updateSiteSettings(session, input);
    return null;
  });
  if (result.ok) revalidatePath("/admin/site-settings");
  return result;
}

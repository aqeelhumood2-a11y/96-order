import type { Session } from "@/core/auth/entities";
import type { SiteSettings } from "@/core/site-settings/entities";
import { defaultSiteSettings } from "@/core/site-settings/entities";
import { siteSettingsInputSchema, type SiteSettingsInput } from "@/core/site-settings/schemas";
import { requirePermission } from "@/services/auth/session";
import { revalidateStorefrontTag, STOREFRONT_CACHE_TAGS } from "@/services/storefront/cache";
import { defaultSiteSettingsDeps, type SiteSettingsDeps } from "./dependencies";

export async function getSiteSettingsForAdmin(actor: Session, deps: SiteSettingsDeps = defaultSiteSettingsDeps): Promise<SiteSettings> {
  requirePermission(actor, "settings:view");
  const stored = await deps.settings.get();
  if (stored) return stored;
  return { ...defaultSiteSettings(), updatedAt: new Date(0), updatedBy: "system" };
}

export async function updateSiteSettings(actor: Session, input: SiteSettingsInput, deps: SiteSettingsDeps = defaultSiteSettingsDeps): Promise<void> {
  requirePermission(actor, "settings:manage");
  const parsed = siteSettingsInputSchema.parse(input);
  const next: SiteSettings = { ...parsed, updatedAt: new Date(), updatedBy: actor.uid };
  await deps.settings.set(next);
  revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.siteSettings);
  await deps.auditLogs.record({ type: "site_settings_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: {} });
}

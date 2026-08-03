import type { SiteSettings } from "@/core/site-settings/entities";
import { defaultPaymentProviderSettings, defaultSiteSettings } from "@/core/site-settings/entities";
import { STOREFRONT_CACHE_TAGS, withStorefrontCache } from "@/services/storefront/cache";
import { defaultSiteSettingsDeps } from "./dependencies";

async function fetchPublicSiteSettings(): Promise<SiteSettings> {
  const stored = await defaultSiteSettingsDeps.settings.get();
  if (stored) {
    // `paymentProviders` (Phase 8) is missing from any settings doc saved
    // before this field existed — treat that the same as "every provider
    // on", matching the app's actual behavior before this field existed.
    return { ...stored, paymentProviders: stored.paymentProviders ?? defaultPaymentProviderSettings() };
  }
  return { ...defaultSiteSettings(), updatedAt: new Date(0), updatedBy: "system" };
}

/**
 * The one read path `Header`/`Footer`/the homepage go through — cached the
 * same way every other storefront read is (`services/storefront/cache.ts`),
 * invalidated by `revalidateStorefrontTag(STOREFRONT_CACHE_TAGS.siteSettings)`
 * whenever `/admin/site-settings` saves. Falls back to `defaultSiteSettings()`
 * before the very first save, so the storefront never breaks on an empty
 * `siteSettings` collection.
 */
export const getPublicSiteSettings = withStorefrontCache("site-settings", [STOREFRONT_CACHE_TAGS.siteSettings], fetchPublicSiteSettings);

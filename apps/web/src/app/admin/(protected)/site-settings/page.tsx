import { ForbiddenError } from "@/core/errors";
import { SiteSettingsForm } from "@/features/admin-site-settings/components/site-settings-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getSiteSettingsForAdmin } from "@/services/site-settings/manage-settings";
import { requireSession } from "@/services/auth/session";

export default async function AdminSiteSettingsPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let settings;
  try {
    settings = await getSiteSettingsForAdmin(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!settings) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{getDictionary(locale).admin.siteSettingsPage.heading}</h1>
      <SiteSettingsForm settings={settings} locale={locale} />
    </div>
  );
}

import { ForbiddenError } from "@/core/errors";
import { SiteSettingsForm } from "@/features/admin-site-settings/components/site-settings-form";
import { getSiteSettingsForAdmin } from "@/services/site-settings/manage-settings";
import { requireSession } from "@/services/auth/session";

export default async function AdminSiteSettingsPage() {
  const session = await requireSession();

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
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Site settings</h1>
      <SiteSettingsForm settings={settings} />
    </div>
  );
}

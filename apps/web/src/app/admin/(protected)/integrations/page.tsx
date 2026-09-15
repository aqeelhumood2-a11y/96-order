import { ForbiddenError } from "@/core/errors";
import { IntegrationsPanel } from "@/features/admin-integrations/components/integrations-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getIntegrationStatus } from "@/services/integrations/get-integration-status";
import { getPosIntegrationForAdmin } from "@/services/integrations/manage-pos-integration";
import { requireSession } from "@/services/auth/session";

export default async function IntegrationsPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

  let status;
  let posIntegration;
  try {
    status = getIntegrationStatus(session);
    posIntegration = await getPosIntegrationForAdmin(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!status || !posIntegration) {
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const dict = getDictionary(locale).admin.integrationsPage;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <p className="mt-1 text-sm text-foreground/69">{dict.subheading}</p>
      </div>
      <IntegrationsPanel status={status} posWebhookUrl={posIntegration.webhookUrl} posHasApiKey={Boolean(posIntegration.apiKey)} locale={locale} />
    </div>
  );
}

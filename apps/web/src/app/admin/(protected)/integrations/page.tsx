import { ForbiddenError } from "@/core/errors";
import { IntegrationsPanel } from "@/features/admin-integrations/components/integrations-panel";
import { getIntegrationStatus } from "@/services/integrations/get-integration-status";
import { requireSession } from "@/services/auth/session";

export default async function IntegrationsPage() {
  const session = await requireSession();

  let status;
  try {
    status = getIntegrationStatus(session);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!status) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Integrations</h1>
        <p className="mt-1 text-sm text-foreground/60">Payment providers, AI assistant, and external system access.</p>
      </div>
      <IntegrationsPanel status={status} />
    </div>
  );
}

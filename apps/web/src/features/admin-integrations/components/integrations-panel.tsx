"use client";

import { useState } from "react";
import type { IntegrationStatus } from "@/services/integrations/get-integration-status";
import { retryFailedEmailsAction, retryFailedNotificationsAction } from "@/features/admin-integrations/actions";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

function StatusRow({ label, configured, envVar, dict }: { label: string; configured: boolean; envVar: string; dict: Dictionary["admin"]["integrationsPage"] }) {
  return (
    <div className="flex items-center justify-between border-b border-surface-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-brand-950">{label}</p>
        <p className="text-xs text-foreground/65">{envVar}</p>
      </div>
      <Badge variant={configured ? "success" : "neutral"}>{configured ? dict.configured : dict.notConfigured}</Badge>
    </div>
  );
}

function RetryQueueCard({
  title,
  description,
  buttonLabel,
  action,
  dict,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  action: () => Promise<{ ok: true; data: { attempted: number; succeeded: number; stillFailing: number } } | { ok: false; message: string }>;
  dict: Dictionary["admin"]["integrationsPage"];
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await action();
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(
      dict.retryResult
        .replace("{attempted}", String(result.data.attempted))
        .replace("{succeeded}", String(result.data.succeeded))
        .replace("{stillFailing}", String(result.data.stillFailing)),
    );
  }

  return (
    <div className="rounded-md border border-surface-border p-4">
      <h2 className="mb-2 text-sm font-semibold text-brand-950">{title}</h2>
      <p className="mb-3 text-xs text-foreground/69">{description}</p>
      <Button size="sm" onClick={handleRetry} disabled={pending}>
        {pending ? dict.retrying : buttonLabel}
      </Button>
      {message && <p className="mt-2 text-sm text-success-700">{message}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function IntegrationsPanel({ status, locale = DEFAULT_LOCALE }: { status: IntegrationStatus; locale?: Locale }) {
  const dict = getDictionary(locale).admin.integrationsPage;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">{dict.providersTitle}</h2>
        <StatusRow label={dict.tapPayments} configured={status.tapConfigured} envVar="TAP_SECRET_KEY" dict={dict} />
        <StatusRow label={dict.transactionalEmail} configured={status.smtpConfigured} envVar="SMTP_HOST / SMTP_USER / SMTP_PASSWORD" dict={dict} />
        <StatusRow label={dict.aiAssistant} configured={status.anthropicConfigured} envVar="ANTHROPIC_API_KEY" dict={dict} />
      </div>

      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">{dict.systemTitle}</h2>
        <StatusRow label={dict.jobApiAccess} configured={status.jobSecretConfigured} envVar="JOB_SECRET" dict={dict} />
        <p className="mt-3 text-xs text-foreground/69">{dict.schedulerNote}</p>
      </div>

      <RetryQueueCard
        title={dict.emailRetryTitle}
        description={dict.emailRetryDescription}
        buttonLabel={dict.emailRetryButton}
        action={retryFailedEmailsAction}
        dict={dict}
      />
      <RetryQueueCard
        title={dict.notificationRetryTitle}
        description={dict.notificationRetryDescription}
        buttonLabel={dict.notificationRetryButton}
        action={retryFailedNotificationsAction}
        dict={dict}
      />
    </div>
  );
}

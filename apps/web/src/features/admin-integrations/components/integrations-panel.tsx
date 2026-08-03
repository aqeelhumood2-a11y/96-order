"use client";

import { useState } from "react";
import type { IntegrationStatus } from "@/services/integrations/get-integration-status";
import { retryFailedEmailsAction, retryFailedNotificationsAction } from "@/features/admin-integrations/actions";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";

function StatusRow({ label, configured, envVar }: { label: string; configured: boolean; envVar: string }) {
  return (
    <div className="flex items-center justify-between border-b border-surface-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-brand-950">{label}</p>
        <p className="text-xs text-foreground/50">{envVar}</p>
      </div>
      <Badge variant={configured ? "success" : "neutral"}>{configured ? "Configured" : "Not configured"}</Badge>
    </div>
  );
}

function RetryQueueCard({
  title,
  description,
  buttonLabel,
  action,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  action: () => Promise<{ ok: true; data: { attempted: number; succeeded: number; stillFailing: number } } | { ok: false; message: string }>;
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
    setMessage(`Retried ${result.data.attempted}: ${result.data.succeeded} sent, ${result.data.stillFailing} still failing.`);
  }

  return (
    <div className="rounded-md border border-surface-border p-4">
      <h2 className="mb-2 text-sm font-semibold text-brand-950">{title}</h2>
      <p className="mb-3 text-xs text-foreground/60">{description}</p>
      <Button size="sm" onClick={handleRetry} disabled={pending}>
        {pending ? "Retrying…" : buttonLabel}
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

export function IntegrationsPanel({ status }: { status: IntegrationStatus }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">Payment, email &amp; AI providers</h2>
        <StatusRow label="Tap Payments (card checkout)" configured={status.tapConfigured} envVar="TAP_SECRET_KEY" />
        <StatusRow label="Transactional email (SMTP)" configured={status.smtpConfigured} envVar="SMTP_HOST / SMTP_USER / SMTP_PASSWORD" />
        <StatusRow label="AI Admin Assistant" configured={status.anthropicConfigured} envVar="ANTHROPIC_API_KEY" />
      </div>

      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">System &amp; ERP integration</h2>
        <StatusRow label="Job/integration API access" configured={status.jobSecretConfigured} envVar="JOB_SECRET" />
        <p className="mt-3 text-xs text-foreground/60">
          When configured, an external scheduler can call{" "}
          <code className="rounded bg-surface-sunken px-1">POST /api/jobs/retry-failed-emails</code>,{" "}
          <code className="rounded bg-surface-sunken px-1">POST /api/jobs/retry-failed-notifications</code>, and{" "}
          <code className="rounded bg-surface-sunken px-1">POST /api/jobs/expire-reservations</code>; an ERP/inventory system can poll{" "}
          <code className="rounded bg-surface-sunken px-1">GET /api/integrations/orders/sync</code> — all with{" "}
          <code className="rounded bg-surface-sunken px-1">Authorization: Bearer JOB_SECRET</code>.
        </p>
      </div>

      <RetryQueueCard
        title="Email retry queue"
        description="Manually drain failed transactional emails now, instead of waiting for the next scheduled run."
        buttonLabel="Retry failed emails now"
        action={retryFailedEmailsAction}
      />
      <RetryQueueCard
        title="Back-in-stock notification retry queue"
        description="Manually drain failed back-in-stock notification emails now, instead of waiting for the next scheduled run."
        buttonLabel="Retry failed notifications now"
        action={retryFailedNotificationsAction}
      />
    </div>
  );
}

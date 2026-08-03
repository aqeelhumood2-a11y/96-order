"use client";

import { useState } from "react";
import type { IntegrationStatus } from "@/services/integrations/get-integration-status";
import { retryFailedEmailsAction } from "@/features/admin-integrations/actions";
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

export function IntegrationsPanel({ status }: { status: IntegrationStatus }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await retryFailedEmailsAction();
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`Retried ${result.data.attempted} email(s): ${result.data.succeeded} sent, ${result.data.stillFailing} still failing.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">Payment &amp; AI providers</h2>
        <StatusRow label="Tap Payments (card checkout)" configured={status.tapConfigured} envVar="TAP_SECRET_KEY" />
        <StatusRow label="AI Admin Assistant" configured={status.anthropicConfigured} envVar="ANTHROPIC_API_KEY" />
      </div>

      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">System &amp; ERP integration</h2>
        <StatusRow label="Job/integration API access" configured={status.jobSecretConfigured} envVar="JOB_SECRET" />
        <p className="mt-3 text-xs text-foreground/60">
          When configured, an external scheduler can call <code className="rounded bg-surface-sunken px-1">POST /api/jobs/retry-failed-emails</code> and an
          ERP/inventory system can poll <code className="rounded bg-surface-sunken px-1">GET /api/integrations/orders/sync</code>, both with
          <code className="ml-1 rounded bg-surface-sunken px-1">Authorization: Bearer JOB_SECRET</code>.
        </p>
      </div>

      <div className="rounded-md border border-surface-border p-4">
        <h2 className="mb-2 text-sm font-semibold text-brand-950">Email retry queue</h2>
        <p className="mb-3 text-xs text-foreground/60">Manually drain failed transactional emails now, instead of waiting for the next scheduled run.</p>
        <Button size="sm" onClick={handleRetry} disabled={pending}>
          {pending ? "Retrying…" : "Retry failed emails now"}
        </Button>
        {message && <p className="mt-2 text-sm text-success-700">{message}</p>}
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

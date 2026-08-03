import type { Session } from "@/core/auth/entities";
import { hasAnthropicCredentials } from "@/infrastructure/ai/anthropic-env";
import { hasTapCredentials } from "@/infrastructure/payments/tap/env";
import { requirePermission } from "@/services/auth/session";

export interface IntegrationStatus {
  tapConfigured: boolean;
  anthropicConfigured: boolean;
  jobSecretConfigured: boolean;
}

/**
 * Presence-only status for every optional external credential this app
 * knows how to use — never the credential values themselves, so this is
 * safe to render on an admin page. See each credential's own env-check
 * (`hasTapCredentials`, `hasAnthropicCredentials`) and `lib/verify-job-secret.ts`
 * for what each gates.
 */
export function getIntegrationStatus(actor: Session): IntegrationStatus {
  requirePermission(actor, "integrations:view");
  return {
    tapConfigured: hasTapCredentials(),
    anthropicConfigured: hasAnthropicCredentials(),
    jobSecretConfigured: Boolean(process.env.JOB_SECRET),
  };
}

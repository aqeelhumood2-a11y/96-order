import type { Session } from "@/core/auth/entities";
import { defaultPosIntegrationSettings, type PosIntegrationSettings } from "@/core/integrations/entities";
import { posIntegrationInputSchema, type PosIntegrationInput } from "@/core/integrations/schemas";
import { requirePermission } from "@/services/auth/session";
import { defaultIntegrationsDeps, type IntegrationsDeps } from "./dependencies";

/**
 * Admin-only read/write for the POS webhook URL + API key — never routed
 * through anything the storefront reads (see `core/integrations/entities.ts`).
 */
export async function getPosIntegrationForAdmin(actor: Session, deps: IntegrationsDeps = defaultIntegrationsDeps): Promise<PosIntegrationSettings> {
  requirePermission(actor, "integrations:view");
  const stored = await deps.posIntegration.get();
  if (stored) return stored;
  return { ...defaultPosIntegrationSettings(), updatedAt: new Date(0), updatedBy: "system" };
}

/**
 * The admin form never gets the real stored API key back (see the form
 * component's doc comment), so an empty `apiKey` here means "leave it
 * alone" rather than "clear it" — only a non-empty value overwrites the
 * one already on file. There is deliberately no way to clear a saved key
 * back to empty from this form; that's an acceptable tradeoff since a
 * defunct key can simply be replaced with a new one.
 */
export async function updatePosIntegration(actor: Session, input: PosIntegrationInput, deps: IntegrationsDeps = defaultIntegrationsDeps): Promise<void> {
  requirePermission(actor, "integrations:manage");
  const parsed = posIntegrationInputSchema.parse(input);
  const existing = await deps.posIntegration.get();
  const next: PosIntegrationSettings = {
    webhookUrl: parsed.webhookUrl,
    apiKey: parsed.apiKey || existing?.apiKey || "",
    updatedAt: new Date(),
    updatedBy: actor.uid,
  };
  await deps.posIntegration.set(next);

  // Never the API key itself, and not even the webhook URL — just whether
  // one is now on file — since audit log entries are visible to anyone
  // with `audit_logs:view`, a broader permission than `integrations:manage`.
  await deps.auditLogs.record({
    type: "pos_integration_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { webhookConfigured: Boolean(next.webhookUrl), apiKeyConfigured: Boolean(next.apiKey) },
  });
}

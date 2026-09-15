"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePosIntegrationAction } from "@/features/admin-integrations/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";

/**
 * The real API key is never sent to the browser (see
 * `services/integrations/manage-pos-integration.ts`'s doc comment) — this
 * form only ever shows whether one is currently on file, never its value.
 * Submitting with the API key field left blank keeps whatever key is
 * already saved; typing a new value replaces it.
 */
export function PosIntegrationForm({ webhookUrl, hasApiKey, locale = DEFAULT_LOCALE }: { webhookUrl: string; hasApiKey: boolean; locale?: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale).admin.integrationsPage;
  const [url, setUrl] = useState(webhookUrl);
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setIsSubmitting(true);
    try {
      const result = await updatePosIntegrationAction({ webhookUrl: url, apiKey });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setApiKey("");
      setSaved(true);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-md border border-surface-border p-4">
      <h2 className="mb-1 text-sm font-semibold text-brand-950">{dict.posIntegrationTitle}</h2>
      <p className="mb-3 text-xs text-foreground/69">{dict.posIntegrationDescription}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pos-webhook-url">{dict.posWebhookUrl}</Label>
          <Input id="pos-webhook-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} disabled={isSubmitting} placeholder="https://…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pos-api-key">{dict.posApiKey}</Label>
          <Input
            id="pos-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={isSubmitting}
            placeholder={hasApiKey ? dict.posApiKeyPlaceholderSet : dict.posApiKeyPlaceholderUnset}
            autoComplete="off"
          />
          <p className="text-xs text-foreground/65">{hasApiKey ? dict.posApiKeyConfigured : dict.posApiKeyNotConfigured}</p>
        </div>
        <div>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? dict.posIntegrationSaving : dict.posIntegrationSave}
          </Button>
        </div>
        {saved && (
          <p role="status" className="text-sm text-success-700">
            {dict.posIntegrationSaved}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

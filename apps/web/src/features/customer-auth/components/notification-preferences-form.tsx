"use client";

import { useState } from "react";
import { updateMarketingConsentAction, updateNotificationPreferencesAction } from "@/features/customer-auth/actions";
import type { NotificationPreferences } from "@/core/customer-auth/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function NotificationPreferencesForm({
  preferences,
  marketingConsent,
  locale = DEFAULT_LOCALE,
}: {
  preferences: NotificationPreferences;
  marketingConsent: boolean;
  locale?: Locale;
}) {
  const dict = getDictionary(locale).storefront.account.notifications;
  const labels: Record<keyof NotificationPreferences, string> = {
    orderUpdates: dict.orderUpdates,
    backInStock: dict.backInStock,
    promotions: dict.promotions,
    questionAnswered: dict.questionAnswered,
    reviewStatusChanges: dict.reviewStatusChanges,
  };
  const [prefs, setPrefs] = useState(preferences);
  const [consent, setConsent] = useState(marketingConsent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const [prefsResult, consentResult] = await Promise.all([updateNotificationPreferencesAction(prefs), updateMarketingConsentAction({ marketingConsent: consent })]);
      setMessage(prefsResult.ok && consentResult.ok ? dict.preferencesSaved : dict.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-brand-950">{dict.transactionalHeading}</legend>
        {(Object.keys(labels) as (keyof NotificationPreferences)[])
          .filter((key) => key !== "promotions")
          .map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" checked={prefs[key]} onChange={(event) => setPrefs((prev) => ({ ...prev, [key]: event.target.checked }))} disabled={isSubmitting} />
              {labels[key]}
            </label>
          ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-brand-950">{dict.marketingHeading}</legend>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={isSubmitting} />
          {dict.marketingConsentLabel}
        </label>
      </fieldset>

      {message && (
        <p role="status" className="text-sm text-foreground/70">
          {message}
        </p>
      )}

      <Button type="button" onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? dict.saving : dict.savePreferences}
      </Button>
    </div>
  );
}

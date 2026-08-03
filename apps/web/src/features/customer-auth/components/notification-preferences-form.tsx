"use client";

import { useState } from "react";
import { updateMarketingConsentAction, updateNotificationPreferencesAction } from "@/features/customer-auth/actions";
import type { NotificationPreferences } from "@/core/customer-auth/entities";
import { Button } from "@/ui/primitives/button";

const LABELS: Record<keyof NotificationPreferences, string> = {
  orderUpdates: "Order status updates",
  backInStock: "Back-in-stock alerts",
  promotions: "Promotions and offers",
  questionAnswered: "My product questions were answered",
  reviewStatusChanges: "My review status changes",
};

export function NotificationPreferencesForm({ preferences, marketingConsent }: { preferences: NotificationPreferences; marketingConsent: boolean }) {
  const [prefs, setPrefs] = useState(preferences);
  const [consent, setConsent] = useState(marketingConsent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const [prefsResult, consentResult] = await Promise.all([updateNotificationPreferencesAction(prefs), updateMarketingConsentAction({ marketingConsent: consent })]);
      setMessage(prefsResult.ok && consentResult.ok ? "Preferences saved." : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-brand-950">Transactional notifications</legend>
        {(Object.keys(LABELS) as (keyof NotificationPreferences)[])
          .filter((key) => key !== "promotions")
          .map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" checked={prefs[key]} onChange={(event) => setPrefs((prev) => ({ ...prev, [key]: event.target.checked }))} disabled={isSubmitting} />
              {LABELS[key]}
            </label>
          ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-brand-950">Marketing</legend>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={isSubmitting} />
          Send me offers and promotions by email
        </label>
      </fieldset>

      {message && (
        <p role="status" className="text-sm text-foreground/70">
          {message}
        </p>
      )}

      <Button type="button" onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}

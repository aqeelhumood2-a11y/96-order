"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function ResendVerificationButton({ action, locale = DEFAULT_LOCALE }: { action: () => Promise<ActionResult<null>>; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.resendVerification;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await action();
      setMessage(result.ok ? dict.sent : result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? dict.sending : dict.resend}
      </Button>
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reorderAction } from "@/features/customer-orders/actions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives/button";

export function ReorderButton({ orderNumber, locale = DEFAULT_LOCALE }: { orderNumber: string; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.account.pages;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await reorderAction(orderNumber);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(
        result.data.skippedCount > 0
          ? dict.addedToCartWithSkipped.replace("{added}", String(result.data.addedCount)).replace("{skipped}", String(result.data.skippedCount))
          : dict.addedToCartMessage.replace("{count}", String(result.data.addedCount)),
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" size="sm" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? dict.addingToCart : dict.reorder}
      </Button>
      {message && (
        <p role="status" className="text-xs text-foreground/70">
          {message}
        </p>
      )}
    </div>
  );
}

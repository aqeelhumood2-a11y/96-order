"use client";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n/locale-types";
import { Button } from "@/ui/primitives";

export interface ListingErrorProps {
  onRetry?: () => void;
}

function readClientLocale() {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Generic catalog-load failure — deliberately vague (no stack traces or
 * internal details reach the browser). Only mounted from a Next.js
 * `error.tsx` boundary, which is always a client component with no server
 * `locale` prop to receive, so the locale cookie is read directly here.
 */
export function ListingError({ onRetry }: ListingErrorProps) {
  const dict = getDictionary(readClientLocale()).storefront.listing;

  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-danger-200 px-6 py-16 text-center">
      <p className="text-base font-medium text-brand-950">{dict.loadError}</p>
      <p className="max-w-sm text-sm text-foreground/69">{dict.loadErrorHint}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          {dict.tryAgain}
        </Button>
      )}
    </div>
  );
}

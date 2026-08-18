"use client";

import { LOCALE_COOKIE, type Locale } from "./locale-types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function setLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
  // A full reload (not router.refresh()) so every server-rendered string —
  // including <html lang/dir> in the root layout — re-renders from scratch
  // in the new language; a partial refresh risks a page stuck half-mirrored.
  window.location.reload();
}

/** One control, either language: "EN" and "عربي" sit side by side, the active one shown as plain text and the other as the switch action — matches how the feature was asked for ("EN | عربي"). */
export function LanguageSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <div className={className} aria-label="Language">
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={locale === "en" ? "font-semibold text-brand-950" : "text-brand-700 hover:text-brand-950"}
      >
        EN
      </button>
      <span className="mx-1 text-brand-300" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        aria-current={locale === "ar" ? "true" : undefined}
        className={locale === "ar" ? "font-semibold text-brand-950" : "text-brand-700 hover:text-brand-950"}
      >
        عربي
      </button>
    </div>
  );
}

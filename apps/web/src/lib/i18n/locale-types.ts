/**
 * Pure, framework-agnostic locale constants/types — no `server-only`, no
 * `next/headers`. Safe to import from a Client Component *or* a Server
 * Component. `locale.ts`'s `getLocale()` (cookie read, server-only) lives in
 * its own file specifically so a Client Component can get `Locale`/
 * `DEFAULT_LOCALE`/`dirForLocale` without dragging a server-only import into
 * the client bundle — Next.js fails the build the moment any part of a
 * `server-only`-tagged module reaches client code, even an unused export.
 */
export const LOCALE_COOKIE = "locale";
export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

export function dirForLocale(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

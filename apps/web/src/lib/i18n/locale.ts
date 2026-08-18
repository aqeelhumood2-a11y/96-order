import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locale-types";

export * from "./locale-types";

/** Reads the shopper/admin's language preference from a plain (non-httpOnly) cookie set by `LanguageSwitcher` — no account or session required, works for guests too. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

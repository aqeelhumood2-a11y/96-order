/**
 * Bahrain mobile validation only, for Phase 5's single-market scope.
 * Deliberately its own small module (not a generic "world phone" library)
 * so a future second market adds its own `isValidXMobile`/
 * `normalizeXMobile` pair and a country-keyed dispatcher, rather than this
 * file growing an ever-larger regex trying to cover every country at once.
 *
 * A Bahrain mobile number is 8 digits starting with 3, 6, or 7, optionally
 * prefixed with the country code (`973` or `+973`).
 */
const BAHRAIN_MOBILE_PATTERN = /^(?:\+?973)?([367]\d{7})$/;

/** Canonical `+973XXXXXXXX` form, or `null` if `raw` isn't a valid Bahrain mobile number. */
export function normalizeBahrainMobile(raw: string): string | null {
  const digitsOnly = raw.trim().replace(/[\s-]/g, "");
  const match = digitsOnly.match(BAHRAIN_MOBILE_PATTERN);
  if (!match) return null;
  return `+973${match[1]}`;
}

export function isValidBahrainMobile(raw: string): boolean {
  return normalizeBahrainMobile(raw) !== null;
}

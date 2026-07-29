const COMBINING_DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Converts a display string (e.g. a product or category name) into a URL-safe
 * slug. Diacritics are stripped rather than deleted so accented names still
 * produce readable slugs (e.g. accented "Cafe" -> "cafe", not "caf").
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Absolute origin used for canonical URLs, Open Graph tags, and
 * `sitemap.ts`/`robots.ts`. Not validated through `lib/env.ts` — it's a
 * cosmetic/SEO value, not something the app fails to function without, so
 * it falls back to a local dev origin rather than throwing at startup.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "96 Order";

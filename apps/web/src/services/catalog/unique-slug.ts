import { randomBytes } from "node:crypto";
import { slugify } from "@96order/shared";
import { ConflictError } from "@/core/errors";

const MAX_SLUG_ATTEMPTS = 5;

function randomSlugSuffix(): string {
  return randomBytes(3).toString("hex");
}

/**
 * Derives a slug from `name` (unless the caller pinned one explicitly) and
 * retries `attempt` with a short random suffix appended whenever it throws
 * `ConflictError` — the same collision-retry shape already used for order
 * numbers in `services/checkout/create-order.ts`.
 *
 * Slugs strip every non-Latin, non-digit character (see
 * `@96order/shared#slugify`), so an Arabic-only name collapses to just
 * whatever digits it happens to contain — e.g. two differently-named coffee
 * bags that both say "250 g" both slugify to "250" and collide on the
 * second one. An explicit slug still fails immediately on collision (no
 * silent suffix) so a shop owner who deliberately chose a slug is told
 * right away that it's taken, rather than getting one they didn't ask for.
 */
export async function withUniqueSlug<T>(name: string, explicitSlug: string | undefined, attempt: (slug: string) => Promise<T>): Promise<T> {
  if (explicitSlug) {
    return attempt(explicitSlug);
  }

  const base = slugify(name);
  let lastError: unknown;
  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const slug = i === 0 ? base : `${base}-${randomSlugSuffix()}`;
    try {
      return await attempt(slug);
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

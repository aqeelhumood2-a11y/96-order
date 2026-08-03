import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Shared-secret auth for `/api/jobs/*` and `/api/integrations/*` routes —
 * these are hit by an external scheduler or ERP system, never by a
 * logged-in admin's browser session, so they can't go through
 * `requireSession()`/`requirePermission()`. The secret lives in
 * `JOB_SECRET` (set it via Secret Manager in production — see README's
 * Production checklist), sent as `Authorization: Bearer <secret>`.
 *
 * Returns `false` (never throws) whenever `JOB_SECRET` isn't configured —
 * every job route is disabled by default rather than accidentally
 * exposed with no auth, matching the "credential absence = feature off"
 * precedent `infrastructure/payments/tap/env.ts#hasTapCredentials` sets.
 */
export function verifyJobSecret(request: Request): boolean {
  const configured = process.env.JOB_SECRET;
  if (!configured) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!provided) return false;

  const expected = Buffer.from(configured);
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

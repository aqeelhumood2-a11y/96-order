import { logger } from "@/lib/logger";

/**
 * Next.js's built-in server-error hook (stable since Next 15) — fires for
 * every uncaught error in a Server Component, Route Handler, or Server
 * Action, in addition to whatever that code path already does with the
 * error (`toErrorResponse`, `global-error.tsx`'s own `logger.error`, …).
 * This is the one centralized place a real error-monitoring
 * integration (Sentry, Cloud Error Reporting, etc.) would plug into —
 * see README's Error monitoring section. Structured JSON to stdout/stderr
 * is already picked up by Cloud Logging/Cloud Run automatically, so this
 * is meaningful monitoring on its own even before a third-party sink is
 * added.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string },
) {
  logger.error("Unhandled server error", {
    message: error instanceof Error ? error.message : String(error),
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routeType: context.routeType,
  });
}

/**
 * Same-origin check for the two public, pre-auth, state-changing Route
 * Handlers (`/api/auth/session`, `/api/auth/forgot-password`). Authenticated
 * mutations go through Next.js Server Actions instead, which already
 * enforce an Origin/Host check on every invocation — this gives the two
 * pre-auth routes the same class of protection without a second, separate
 * double-submit-cookie scheme to maintain.
 *
 * Compares the `Origin` header against the request's own `Host` header —
 * deliberately not against `new URL(request.url).origin`, which under
 * `next start` can report a normalized hostname (e.g. "localhost") that
 * doesn't reflect the `Host` the client actually sent, making every
 * legitimate same-origin request look cross-origin.
 */
export function verifySameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    const requestHost = request.headers.get("host");
    if (!requestHost) return false;
    try {
      return new URL(origin).host === requestHost;
    } catch {
      return false;
    }
  }

  // A same-origin request occasionally omits Origin; Sec-Fetch-Site is sent
  // by all modern browsers and is a reliable fallback. Requests with
  // neither header (e.g. non-browser clients) are rejected — these routes
  // are only ever meant to be called from our own login/forgot-password pages.
  const secFetchSite = request.headers.get("sec-fetch-site");
  return secFetchSite === "same-origin" || secFetchSite === "none";
}

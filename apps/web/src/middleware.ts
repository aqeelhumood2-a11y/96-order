import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/config/auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * A fresh, cryptographically random nonce per request — the standard
 * Next.js App Router CSP pattern: setting `Content-Security-Policy` here
 * (rather than in `next.config.ts`'s static `headers()`) is what lets
 * `script-src` require this nonce, since a static config-time header can
 * never contain a per-request value. Next.js automatically applies this
 * nonce to every script tag it injects itself (RSC hydration payload,
 * chunk loading, ...) once it sees the nonce in the response's CSP header
 * — no manual `<Script nonce={...}>` wiring needed anywhere in this app,
 * since it renders zero custom inline/external `<script>` tags.
 *
 * `'strict-dynamic'` lets those nonce'd scripts load further first-party
 * chunks without each needing its own nonce/host-allowlist entry — exactly
 * what Next's own code-split bundle loading needs. `'unsafe-eval'` is
 * added only in development, where webpack/Turbopack's eval-based source
 * maps and HMR runtime need it; production builds never include it.
 *
 * Every resource this app actually loads is first-party: no Google Fonts
 * CDN (next/font self-hosts Geist), no client-side Firebase SDK calls (the
 * client never talks to Identity Toolkit/Firestore directly — see
 * `services/auth/create-session.ts`'s doc comment), and Firebase Storage
 * product images are served through `/_next/image` (same-origin) rather
 * than fetched directly by the browser — see `next.config.ts`'s
 * `images.remotePatterns` comment for why that remote host is configured
 * there (server-side fetch) rather than needed here.
 */
function buildContentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = `'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind/Next inject inline <style> tags without a nonce threaded
    // through; style-based XSS is a materially smaller risk than
    // script-based, so 'unsafe-inline' here is an accepted tradeoff.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Edge-runtime, cheap "is there a session cookie at all?" redirect —
 * defense-in-depth and UX only (avoids a flash of protected content before
 * redirecting). It is NOT the authorization boundary: the Admin SDK's
 * `verifySessionCookie` needs Node APIs unavailable on the Edge runtime, so
 * the real, authoritative check (`requireSession()`/`requirePermission()`)
 * runs server-side in `app/admin/layout.tsx` and independently in every
 * Server Action and Route Handler under `/admin` — those don't run through
 * this middleware or through the layout, so each must call it directly.
 *
 * Runs on every page route (see `config.matcher` below) to set the CSP
 * nonce header on every response, not just `/admin/*` — the redirect
 * logic below it still only ever applies under `/admin`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  function withCsp(response: NextResponse): NextResponse {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  if (!pathname.startsWith("/admin")) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublicAdminPath) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  // Every page route except static assets and Next's own image optimizer —
  // API routes are deliberately excluded too (they return JSON, never
  // HTML/scripts a CSP would meaningfully constrain, and several are
  // public webhook/job endpoints that shouldn't pick up a redirect check).
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};

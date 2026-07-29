import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/config/auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

/**
 * Edge-runtime, cheap "is there a session cookie at all?" redirect —
 * defense-in-depth and UX only (avoids a flash of protected content before
 * redirecting). It is NOT the authorization boundary: the Admin SDK's
 * `verifySessionCookie` needs Node APIs unavailable on the Edge runtime, so
 * the real, authoritative check (`requireSession()`/`requirePermission()`)
 * runs server-side in `app/admin/layout.tsx` and independently in every
 * Server Action and Route Handler under `/admin` — those don't run through
 * this middleware or through the layout, so each must call it directly.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublicAdminPath) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

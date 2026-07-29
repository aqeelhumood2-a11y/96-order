import { cache } from "react";
import { cookies } from "next/headers";
import type { Permission } from "@/core/auth/permissions";
import { hasPermission as checkPermission, resolveEffectivePermissions } from "@/core/auth/permissions";
import type { Session } from "@/core/auth/entities";
import { SESSION_COOKIE_NAME } from "@/config/auth";
import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Resolves the current request's session from the `__Host-session` cookie,
 * or `null` if there isn't one, it's invalid/expired/revoked, or the user
 * has been deactivated since the cookie was minted (`checkRevoked: true` in
 * the port is what makes deactivation and force-logout actually take
 * effect immediately rather than only at natural cookie expiry).
 *
 * Wrapped in React's `cache()` so every Server Component, Server Action, and
 * Route Handler in one request shares a single resolution instead of each
 * re-reading Firestore — this is a per-request memoization, not a
 * cross-request cache.
 */
export const getSession = cache(async (deps: AuthDeps = defaultAuthDeps): Promise<Session | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const verified = await deps.authSession.verifySessionCookie(cookie, true);
  if (!verified) return null;

  const user = await deps.users.findByUid(verified.uid);
  if (!user || user.status !== "active") return null;

  const roles = await Promise.all(user.roleIds.map((id) => deps.roles.findById(id)));
  const effectivePermissions = resolveEffectivePermissions(
    user.roleIds,
    user.directPermissions,
    roles.filter((role): role is NonNullable<typeof role> => role !== null),
  );

  return { uid: user.uid, email: user.email, roleIds: user.roleIds, effectivePermissions };
});

/**
 * Every Server Action and Route Handler under `/admin` must call this
 * directly — `admin/layout.tsx`'s redirect is UX-only and does not run for
 * actions or route handlers, so it cannot be the real enforcement boundary.
 */
export async function requireSession(deps: AuthDeps = defaultAuthDeps): Promise<Session> {
  const session = await getSession(deps);
  if (!session) {
    throw new UnauthorizedError("You must be signed in to do this.");
  }
  return session;
}

export function requirePermission(session: Session, permission: Permission): void {
  if (!checkPermission(session, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}.`);
  }
}

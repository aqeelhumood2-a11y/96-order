import { cache } from "react";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/config/customer-auth";
import type { CustomerSession } from "@/core/customer-auth/entities";
import { UnauthorizedError } from "@/core/errors";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

/**
 * Resolves the current request's customer session from the
 * `__Host-customer-session` cookie — completely independent of
 * `services/auth/session.ts#getSession` (staff/admin): different cookie
 * name, different collection (`customerAccounts`, never `users`). A
 * customer can never satisfy an admin `requireSession()` check, and a
 * staff member's admin cookie is never even read here — see
 * `core/customer-auth/entities.ts`'s doc comment. Wrapped in React's
 * `cache()` for the same per-request-memoization reason the admin
 * session is.
 */
export const getCustomerSession = cache(async (deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<CustomerSession | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const verified = await deps.authSession.verifySessionCookie(cookie, true);
  if (!verified) return null;

  const account = await deps.accounts.findByUid(verified.uid);
  if (!account || account.status !== "active") return null;

  return { uid: account.uid, email: account.email, displayName: account.displayName, emailVerified: account.emailVerified };
});

/** Every customer-facing Server Action and Route Handler under `/account` must call this directly — the layout's redirect is UX-only, same discipline as the admin side. */
export async function requireCustomerSession(deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<CustomerSession> {
  const session = await getCustomerSession(deps);
  if (!session) {
    throw new UnauthorizedError("You must be signed in.");
  }
  return session;
}

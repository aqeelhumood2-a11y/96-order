import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { CART_COOKIE_NAME, CART_EXPIRY_MS } from "@/config/cart";
import { signCartId, verifyCartCookieValue } from "@/lib/cart-cookie";

/**
 * Resolves the current guest cart id from its signed cookie, minting a
 * brand-new one (and setting the cookie) if there isn't a valid one yet.
 * Must be called from a Server Action or Route Handler — only those can
 * set cookies; a Server Component can only read them (see `peekCartId`).
 */
export async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE_NAME)?.value;
  const verifiedId = existing ? verifyCartCookieValue(existing) : null;
  if (verifiedId) return verifiedId;

  const newId = randomUUID();
  cookieStore.set(CART_COOKIE_NAME, signCartId(newId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(CART_EXPIRY_MS / 1000),
  });
  return newId;
}

/** Read-only variant for Server Components rendering the cart — never mints or sets a cookie; returns `null` if there isn't a valid one yet (render an empty-cart state in that case). */
export async function peekCartId(): Promise<string | null> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE_NAME)?.value;
  return existing ? verifyCartCookieValue(existing) : null;
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signs/verifies the guest-cart cookie's value — `{cartId}.{hmacSignature}`.
 * The cookie is `HttpOnly` (a script on the page can't read it either
 * way) but is not itself encrypted: a client can still see the raw
 * `cartId` if it inspected the cookie some other way, which is fine,
 * since a cart id alone grants no more access than "read/write this one
 * cart" and carries no personal data. What the signature actually
 * prevents is a client *forging* or *guessing* a different cart id and
 * having the server accept it as their own — every cart lookup goes
 * through `verifyCartCookieValue` first, so an unsigned or mismatched
 * value is treated as "no cart yet," never as someone else's cart.
 */
function getSecret(): string {
  const secret = process.env.CART_COOKIE_SECRET;
  if (!secret) {
    throw new Error("CART_COOKIE_SECRET is not set. Copy .env.example and fill in a long random value.");
  }
  return secret;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function signCartId(cartId: string): string {
  return `${cartId}.${sign(cartId, getSecret())}`;
}

/** Returns the verified cart id, or `null` if the cookie is missing, malformed, or its signature doesn't match (tampered, or signed with a different/rotated secret). */
export function verifyCartCookieValue(cookieValue: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const cartId = cookieValue.slice(0, separatorIndex);
  const providedSignature = cookieValue.slice(separatorIndex + 1);
  const expectedSignature = sign(cartId, getSecret());

  try {
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const providedBuffer = Buffer.from(providedSignature, "hex");
    if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
      return null;
    }
  } catch {
    return null;
  }

  return cartId;
}

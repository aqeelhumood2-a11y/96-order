/**
 * Guest-cart cookie/expiry configuration — see README's Cart persistence
 * section for the full strategy (a signed, server-managed cookie holding
 * only a cart id, with the actual cart contents stored server-side in
 * Firestore; never the cart itself in `localStorage`).
 */

/** `__Host-` prefix requires Secure, no Domain attribute, and Path=/ — enforced where the cookie is set, same convention as `config/auth.ts`'s session cookie. */
export const CART_COOKIE_NAME = "__Host-cart-id";

/** 30 days — long enough that a returning shopper's cart survives a normal browsing gap, short enough that an abandoned guest cart doesn't accumulate in Firestore forever. */
export const CART_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

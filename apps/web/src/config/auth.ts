/**
 * Auth/session configuration constants. Values, not secrets — safe to read
 * from any layer that needs them (session cookie name is referenced by
 * `middleware.ts`, which cannot import server-only Firebase code).
 */

/** `__Host-` prefix requires Secure, no Domain attribute, and Path=/ — enforced where the cookie is set. */
export const SESSION_COOKIE_NAME = "__Host-session";

/** 24 hours. Firebase session cookies cap at 14 days; an admin panel doesn't need anywhere near that. */
export const SESSION_EXPIRES_IN_MS = 24 * 60 * 60 * 1000;

export const RATE_LIMITS = {
  sessionCreateByIp: { limit: 10, windowSeconds: 15 * 60 },
  sessionCreateByEmail: { limit: 5, windowSeconds: 15 * 60 },
  forgotPasswordByIp: { limit: 5, windowSeconds: 15 * 60 },
  forgotPasswordByEmail: { limit: 3, windowSeconds: 15 * 60 },
} as const;

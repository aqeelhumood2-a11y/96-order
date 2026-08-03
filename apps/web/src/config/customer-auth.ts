/**
 * Customer-facing auth/session configuration — deliberately its own file,
 * own cookie name, and own rate-limit keys, never shared with
 * `config/auth.ts` (staff/admin). See `core/customer-auth/entities.ts`'s
 * doc comment for why the two identities are modeled as separate
 * documents even though they can share one Firebase Auth project.
 */
export const CUSTOMER_SESSION_COOKIE_NAME = "__Host-customer-session";

/** 14 days — longer than staff's 24h (`config/auth.ts#SESSION_EXPIRES_IN_MS`), matching how long a shopper actually expects to stay signed in on a personal device; still within Firebase session cookies' 14-day cap. */
export const CUSTOMER_SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

export const CUSTOMER_RATE_LIMITS = {
  registerByIp: { limit: 8, windowSeconds: 60 * 60 },
  sessionCreateByIp: { limit: 10, windowSeconds: 15 * 60 },
  sessionCreateByEmail: { limit: 5, windowSeconds: 15 * 60 },
  forgotPasswordByIp: { limit: 5, windowSeconds: 15 * 60 },
  forgotPasswordByEmail: { limit: 3, windowSeconds: 15 * 60 },
  resendVerificationByEmail: { limit: 3, windowSeconds: 15 * 60 },
  backInStockSubscribeByIp: { limit: 20, windowSeconds: 60 * 60 },
} as const;

/** Same floor-the-response-time discipline as `config/auth.ts#MINIMUM_LOGIN_RESPONSE_MS`, for the same enumeration-resistance reason. */
export const MINIMUM_CUSTOMER_LOGIN_RESPONSE_MS = 300;

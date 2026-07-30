/** Rate limits for public, unauthenticated storefront mutations — the equivalent of `config/auth.ts#RATE_LIMITS` for Phase 5's checkout/tracking endpoints. */
export const STOREFRONT_RATE_LIMITS = {
  checkoutByIp: { limit: 10, windowSeconds: 15 * 60 },
  trackOrderByIp: { limit: 20, windowSeconds: 15 * 60 },
} as const;

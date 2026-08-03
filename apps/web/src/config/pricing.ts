/** Own file, own key namespace — same reasoning as `config/customer-auth.ts`. Guards against brute-forcing coupon codes via repeated "Apply coupon" submissions. */
export const COUPON_APPLY_RATE_LIMIT = { limit: 15, windowSeconds: 60 * 60 } as const;

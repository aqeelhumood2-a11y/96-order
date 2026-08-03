/** Own file, own key namespace — same reasoning as `config/customer-auth.ts`. */
export const REVIEW_RATE_LIMITS = {
  submitByCustomer: { limit: 10, windowSeconds: 60 * 60 },
} as const;

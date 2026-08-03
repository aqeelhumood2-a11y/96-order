export const QUESTION_RATE_LIMITS = {
  askByCustomer: { limit: 10, windowSeconds: 60 * 60 },
} as const;

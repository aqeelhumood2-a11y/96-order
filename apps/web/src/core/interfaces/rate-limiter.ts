export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Fixed-window rate limiter port. Scope note: this only throttles requests
 * that actually reach our server (session-cookie creation, forgot-password).
 * It cannot throttle Firebase client-SDK calls like
 * `signInWithEmailAndPassword`, which talk to Identity Toolkit directly and
 * never touch this backend — see the Phase 2 README's security assumptions
 * section.
 */
export interface RateLimiter {
  /** Consumes one attempt against `key` within `windowSeconds`; denies once `limit` is exceeded. */
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

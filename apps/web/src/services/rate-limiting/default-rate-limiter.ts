import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";

/** The one shared `RateLimiter` instance for storefront-facing Server Actions (checkout submission, order tracking) that need throttling but don't otherwise belong to a services/* composition root of their own. */
export const defaultRateLimiter: RateLimiter = new FirestoreRateLimiter();

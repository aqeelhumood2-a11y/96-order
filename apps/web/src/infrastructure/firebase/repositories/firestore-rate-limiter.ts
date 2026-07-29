import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import type { RateLimitResult, RateLimiter } from "@/core/interfaces/rate-limiter";
import { getAdminFirestore } from "../admin";

const COLLECTION = "rateLimits";

interface RateLimitDoc {
  count: number;
  windowStartMs: number;
  /** Lets a Firestore TTL policy (configured out-of-band — see README) reap old windows. */
  expiresAt: Timestamp;
}

function sanitizeKey(key: string): string {
  return key.replace(/\//g, "_");
}

/**
 * Fixed-window counter, incremented inside a transaction so concurrent
 * requests against the same key can't race past the limit. This throttles
 * requests that reach our server (session creation, forgot-password) — it
 * cannot throttle Firebase client-SDK calls that bypass our backend
 * entirely; see the port's doc comment and the Phase 2 README.
 */
export class FirestoreRateLimiter implements RateLimiter {
  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTION).doc(sanitizeKey(key));
    const windowMs = windowSeconds * 1000;

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const data = snap.exists ? (snap.data() as RateLimitDoc) : null;
      const windowExpired = !data || now - data.windowStartMs >= windowMs;

      if (windowExpired) {
        tx.set(ref, {
          count: 1,
          windowStartMs: now,
          expiresAt: Timestamp.fromMillis(now + windowMs * 2),
        } satisfies RateLimitDoc);
        return { allowed: true };
      }

      if (data.count >= limit) {
        const retryAfterSeconds = Math.ceil((data.windowStartMs + windowMs - now) / 1000);
        return { allowed: false, retryAfterSeconds };
      }

      tx.update(ref, { count: data.count + 1 });
      return { allowed: true };
    });
  }
}

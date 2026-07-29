import "server-only";
import { createHash } from "node:crypto";
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

/**
 * Callers pass a raw, meaningful key (`"session-create:email:user@example.com"`,
 * `"session-create:ip:1.2.3.4"`); this hashes it before it ever becomes a
 * Firestore document id, so no raw email address or IP is ever persisted
 * or visible in the console — only a one-way digest a reader can't reverse
 * back into the original value. Collision resistance is what matters here,
 * not secrecy against a determined attacker with the source, so a plain
 * SHA-256 digest (no secret pepper) is sufficient.
 */
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Fixed-window counter, incremented inside a transaction so concurrent
 * requests against the same key can't race past the limit. This throttles
 * requests that reach our server (session creation, forgot-password) — it
 * cannot throttle Firebase client-SDK calls that bypass our backend
 * entirely; see the port's doc comment and the Phase 2 README. As of the
 * server-side password-auth proxy in create-session.ts, login no longer
 * has such a bypass — see README's rate-limiting design section.
 */
export class FirestoreRateLimiter implements RateLimiter {
  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const db = getAdminFirestore();
    const ref = db.collection(COLLECTION).doc(hashKey(key));
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

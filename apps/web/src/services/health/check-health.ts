import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { logger } from "@/lib/logger";

const FIRESTORE_CHECK_TIMEOUT_MS = 5000;

export interface HealthCheckResult {
  healthy: boolean;
  checks: { firestore: "ok" | "error" };
}

/**
 * Cheapest possible Firestore round-trip (a 1-document `limit()` read on a
 * collection that's always readable, never a write) — proves the Admin SDK
 * can actually reach Firestore, not just that it initialized. See
 * `app/api/health/route.ts` for why this lives in `services`, not `app`
 * (the `app` layer can't import `infrastructure` directly).
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  let firestoreOk = true;
  try {
    await Promise.race([
      getAdminFirestore().collection("siteSettings").limit(1).get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore health check timed out")), FIRESTORE_CHECK_TIMEOUT_MS)),
    ]);
  } catch (error) {
    logger.error("Health check: Firestore unreachable", { message: error instanceof Error ? error.message : String(error) });
    firestoreOk = false;
  }

  return { healthy: firestoreOk, checks: { firestore: firestoreOk ? "ok" : "error" } };
}

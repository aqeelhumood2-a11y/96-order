import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

// 2nd-gen defaults for every function in this codebase unless overridden
// per-function. Region should match wherever the project's Firestore/Storage
// live to avoid cross-region latency and egress cost.
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

/**
 * Unauthenticated liveness check used to verify the Cloud Functions deploy
 * pipeline (build, runtime, region, emulator wiring) without depending on any
 * business feature.
 */
export const healthCheck = onRequest((_request, response) => {
  response.status(200).json({ status: "ok", service: "96-order-functions" });
});

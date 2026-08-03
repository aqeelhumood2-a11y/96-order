import { readFileSync } from "node:fs";
import path from "node:path";
import { assertFails, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-96order",
    firestore: {
      rules: readFileSync(path.join(import.meta.dirname, "../../../../firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

/**
 * Mirrors firestore-security-rules-phase6.test.ts's coverage for every
 * Phase 7 collection — all fourteen are written exclusively through the
 * Admin SDK, gated by `requireCustomerSession()`/`requirePermission()` in
 * `services/*`, never opened to a client SDK path (authenticated or not)
 * — see `firestore.rules`'s Phase 7 comment block for why even a
 * signed-in customer's own data isn't scoped to their uid here.
 */
const PHASE_7_COLLECTIONS = [
  "customerAccounts",
  "customerEmailVerifications",
  "customerAddresses",
  "wishlistItems",
  "backInStockSubscriptions",
  "notificationOutbox",
  "reviews",
  "reviewAggregates",
  "productQuestions",
  "cmsPages",
  "siteSettings",
  "coupons",
  "couponRedemptions",
  "promotions",
];

describe("firestore.rules — Phase 7 collections", () => {
  for (const collection of PHASE_7_COLLECTIONS) {
    describe(collection, () => {
      it("denies an unauthenticated client", async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(db.collection(collection).doc("doc-1").get());
      });

      it("denies an arbitrary authenticated client (not server-side Admin SDK)", async () => {
        const db = testEnv.authenticatedContext("arbitrary-uid").firestore();
        await assertFails(db.collection(collection).doc("doc-1").get());
        await assertFails(db.collection(collection).doc("doc-1").set({ probe: true }));
      });

      it("denies a client authenticated as the document's own id (no owner carve-out)", async () => {
        // Exercises the specific case `firestore.rules`'s Phase 7 comment
        // calls out: even when the authenticated uid matches what would be
        // the "owning" document id (e.g. a customer's own `customerAccounts`
        // doc), there is still no rule opening it — every read/write for
        // this collection happens server-side only.
        const db = testEnv.authenticatedContext("doc-1").firestore();
        await assertFails(db.collection(collection).doc("doc-1").get());
      });
    });
  }
});

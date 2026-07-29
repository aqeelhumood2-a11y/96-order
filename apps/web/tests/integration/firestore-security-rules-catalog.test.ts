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
 * Mirrors firestore-security-rules.test.ts's Phase 2 coverage, for the six
 * Phase 3 catalog/inventory collections. Every one of these is written
 * exclusively through the Admin SDK (see services/catalog/*), so a client
 * SDK — authenticated or not — must never reach any of them.
 */
describe("firestore.rules — Phase 3 catalog collections", () => {
  it("denies an unauthenticated client on every Phase 3 collection", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.collection("products").doc("some-product").get());
    await assertFails(db.collection("products").doc("some-product").set({ name: "x" }));
    await assertFails(db.collection("categories").doc("some-category").get());
    await assertFails(db.collection("brands").doc("some-brand").get());
    await assertFails(db.collection("inventory").doc("some-record").get());
    await assertFails(db.collection("inventoryAdjustments").add({ reason: "manual_adjustment" }));
    await assertFails(db.collection("catalogUniqueKeys").doc("sku:ABC").get());
  });

  it("denies an arbitrary authenticated client (not server-side Admin SDK) on every Phase 3 collection", async () => {
    const db = testEnv.authenticatedContext("arbitrary-uid").firestore();

    await assertFails(db.collection("products").doc("some-product").set({ name: "x", status: "active" }));
    await assertFails(db.collection("categories").doc("some-category").set({ name: "x" }));
    await assertFails(db.collection("brands").doc("some-brand").set({ name: "x" }));
    await assertFails(db.collection("inventory").doc("some-record").set({ onHand: 999 }));
    await assertFails(db.collection("inventoryAdjustments").add({ reason: "manual_adjustment", quantityDelta: 1000 }));
    await assertFails(db.collection("catalogUniqueKeys").doc("sku:ABC").set({ ownerId: "attacker-product" }));
  });
});

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
 * Mirrors firestore-security-rules-phase5.test.ts's coverage for Phase 6's
 * one new collection, `customers` — written exclusively through the
 * Admin SDK (`services/customers/*`), holding the same class of private
 * customer data `orders`/`payments` already do, so it stays fully denied
 * to every client SDK path the same way.
 */
describe("firestore.rules — Phase 6 customers collection", () => {
  it("denies an unauthenticated client", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection("customers").doc("ahmed@example.com").get());
  });

  it("denies an arbitrary authenticated client (not server-side Admin SDK)", async () => {
    const db = testEnv.authenticatedContext("arbitrary-uid").firestore();
    await assertFails(db.collection("customers").doc("ahmed@example.com").get());
    await assertFails(db.collection("customers").doc("ahmed@example.com").set({ fullName: "Fake" }));
  });
});

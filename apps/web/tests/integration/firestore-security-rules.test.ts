import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
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
 * These exercise `firestore.rules` through the client-equivalent testing
 * SDK (not the Admin SDK, which bypasses rules entirely) — this is the
 * only layer that actually proves the Phase 2 collections are unreachable
 * from anything except server-side Admin SDK code.
 */
describe("firestore.rules — Phase 2 collections", () => {
  it("denies an unauthenticated client on every Phase 2 collection", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.collection("users").doc("someone").get());
    await assertFails(db.collection("users").doc("someone").set({ email: "x@example.com" }));
    await assertFails(db.collection("roles").doc("some-role").get());
    await assertFails(db.collection("auditLogs").add({ type: "login_success" }));
    await assertFails(db.collection("system").doc("bootstrap").get());
    await assertFails(db.collection("rateLimits").doc("some-key").get());
  });

  it("denies an arbitrary authenticated client (not server-side Admin SDK) on every Phase 2 collection", async () => {
    const db = testEnv.authenticatedContext("arbitrary-uid").firestore();

    await assertFails(db.collection("users").doc("arbitrary-uid").get());
    await assertFails(db.collection("users").doc("arbitrary-uid").set({ email: "x@example.com", status: "active" }));
    await assertFails(db.collection("roles").doc("super_admin").get());
    await assertFails(db.collection("auditLogs").add({ type: "login_success" }));
    await assertFails(db.collection("system").doc("bootstrap").get());
    await assertFails(db.collection("rateLimits").doc("login:ip:1.2.3.4").set({ count: 0 }));
  });

  it("still denies an arbitrary future-module collection under the Phase 1 wildcard baseline", async () => {
    const db = testEnv.authenticatedContext("arbitrary-uid").firestore();
    await assertFails(db.collection("products").doc("some-product").get());
  });
});

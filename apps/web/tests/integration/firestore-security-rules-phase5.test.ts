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
 * Mirrors firestore-security-rules-catalog.test.ts's Phase 3 coverage, for
 * Phase 5's cart/checkout/payment/reservation collections. Every one of
 * these is written exclusively through the Admin SDK (see
 * services/cart/*, services/checkout/*, services/payments/*,
 * services/inventory/*), so a client SDK — authenticated or not — must
 * never reach any of them. `orders`/`payments` additionally hold private
 * customer data, which is exactly why "an arbitrary authenticated client"
 * (not just an unauthenticated one) must be denied too — there is no
 * concept of "the owning shopper" in Firestore's own auth model here;
 * public order tracking goes through `services/orders/track-order.ts`
 * instead, which enforces its own verification factor server-side.
 */
describe("firestore.rules — Phase 5 checkout/payment collections", () => {
  it("denies an unauthenticated client on every Phase 5 collection", async () => {
    const db = testEnv.unauthenticatedContext().firestore();

    await assertFails(db.collection("carts").doc("some-cart").get());
    await assertFails(db.collection("orders").doc("some-order").get());
    await assertFails(db.collection("orderEvents").add({ orderId: "some-order" }));
    await assertFails(db.collection("payments").doc("some-payment").get());
    await assertFails(db.collection("paymentEvents").doc("evt_1").get());
    await assertFails(db.collection("inventoryReservations").doc("some-reservation").get());
    await assertFails(db.collection("checkoutIdempotency").doc("checkout:some-key").get());
    await assertFails(db.collection("emailOutbox").doc("some-entry").get());
  });

  it("denies an arbitrary authenticated client (not server-side Admin SDK) on every Phase 5 collection", async () => {
    const db = testEnv.authenticatedContext("arbitrary-uid").firestore();

    await assertFails(db.collection("carts").doc("some-cart").set({ lines: [] }));
    await assertFails(db.collection("orders").doc("some-order").set({ orderNumber: "ORD-FAKE" }));
    await assertFails(db.collection("orders").doc("some-order").get());
    await assertFails(db.collection("payments").doc("some-payment").set({ status: "paid" }));
    await assertFails(db.collection("paymentEvents").doc("evt_1").set({ eventType: "charge.captured" }));
    await assertFails(db.collection("inventoryReservations").doc("some-reservation").set({ status: "committed" }));
    await assertFails(db.collection("checkoutIdempotency").doc("checkout:some-key").set({ status: "completed" }));
    await assertFails(db.collection("emailOutbox").doc("some-entry").set({ status: "sent" }));
  });
});

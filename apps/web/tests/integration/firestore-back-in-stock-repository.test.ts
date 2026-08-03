import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import { FirestoreBackInStockRepository } from "@/infrastructure/firebase/repositories/firestore-back-in-stock-repository";

const repo = new FirestoreBackInStockRepository();

function makeSubscription(overrides: Partial<BackInStockSubscription> = {}): BackInStockSubscription {
  return {
    id: "",
    customerUid: null,
    email: `shopper-${randomUUID().slice(0, 8)}@example.com`,
    productId: "product-1",
    variantId: null,
    status: "pending",
    unsubscribeToken: randomUUID(),
    createdAt: new Date(),
    notifiedAt: null,
    ...overrides,
  };
}

describe("FirestoreBackInStockRepository (emulator)", () => {
  it("subscribe() is idempotent for an already-pending subscription", async () => {
    const email = `shopper-${randomUUID().slice(0, 8)}@example.com`;
    const first = await repo.subscribe(makeSubscription({ email, productId: "product-1" }));
    const second = await repo.subscribe(makeSubscription({ email, productId: "product-1" }));

    expect(second.id).toBe(first.id);
    const all = await repo.listPendingByProduct("product-1", null);
    expect(all.filter((sub) => sub.email === email)).toHaveLength(1);
  });

  it("subscribe() flips a cancelled subscription back to pending on resubscribe", async () => {
    const email = `shopper-${randomUUID().slice(0, 8)}@example.com`;
    const subscription = await repo.subscribe(makeSubscription({ email, productId: "product-2" }));
    await repo.cancel(subscription.id);

    const resubscribed = await repo.subscribe(makeSubscription({ email, productId: "product-2" }));
    expect(resubscribed.id).toBe(subscription.id);
    expect(resubscribed.status).toBe("pending");

    const found = await repo.findById(subscription.id);
    expect(found?.status).toBe("pending");
  });

  it("listPendingByProduct() only returns pending subscriptions for that exact product/variant", async () => {
    const productId = `product-${randomUUID()}`;
    await repo.subscribe(makeSubscription({ email: "a@example.com", productId, variantId: null }));
    await repo.subscribe(makeSubscription({ email: "b@example.com", productId, variantId: "variant-x" }));
    const notified = await repo.subscribe(makeSubscription({ email: "c@example.com", productId, variantId: null }));
    await repo.markNotified(notified.id);

    const pending = await repo.listPendingByProduct(productId, null);
    expect(pending.map((sub) => sub.email)).toEqual(["a@example.com"]);
  });

  it("markNotified() sets status and notifiedAt", async () => {
    const subscription = await repo.subscribe(makeSubscription());
    await repo.markNotified(subscription.id);

    const found = await repo.findById(subscription.id);
    expect(found?.status).toBe("notified");
    expect(found?.notifiedAt).not.toBeNull();
  });

  it("listByCustomer() returns every subscription for that customer uid", async () => {
    const customerUid = `customer-${randomUUID()}`;
    await repo.subscribe(makeSubscription({ customerUid, email: "x@example.com", productId: "product-a" }));
    await repo.subscribe(makeSubscription({ customerUid, email: "x@example.com", productId: "product-b" }));

    const subscriptions = await repo.listByCustomer(customerUid);
    expect(subscriptions).toHaveLength(2);
  });
});

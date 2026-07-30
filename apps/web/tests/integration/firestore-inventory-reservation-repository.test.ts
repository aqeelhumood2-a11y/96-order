import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/errors";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestoreInventoryReservationRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-reservation-repository";

const reservations = new FirestoreInventoryReservationRepository();
const inventory = new FirestoreInventoryRepository();

const FUTURE = new Date(Date.now() + 30 * 60 * 1000);
const PAST = new Date(Date.now() - 60 * 1000);

describe("FirestoreInventoryReservationRepository (emulator)", () => {
  it("reserve() creates a reservation and increments the inventory record's reserved count", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });

    const reservation = await reservations.reserve({
      orderId: randomUUID(),
      productId,
      variantId: null,
      quantity: 4,
      allowBackorder: false,
      actorId: "actor-1",
      expiresAt: FUTURE,
    });

    expect(reservation.status).toBe("reserved");
    expect(reservation.quantity).toBe(4);
    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(4);
  });

  it("is idempotent — reserving twice for the same order+product+variant returns the existing reservation, not a second one", async () => {
    const productId = randomUUID();
    const orderId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });

    const first = await reservations.reserve({ orderId, productId, variantId: null, quantity: 3, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });
    const second = await reservations.reserve({ orderId, productId, variantId: null, quantity: 3, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });

    expect(second.id).toBe(first.id);
    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(3);
  });

  it("throws ConflictError when there isn't enough available stock and backorder isn't allowed", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 2, allowBackorder: false, actorId: "actor-1" });

    await expect(
      reservations.reserve({ orderId: randomUUID(), productId, variantId: null, quantity: 5, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE }),
    ).rejects.toThrow(ConflictError);
  });

  it("allows reserving beyond on-hand stock when backorder is allowed", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 1, allowBackorder: true, actorId: "actor-1" });

    const reservation = await reservations.reserve({
      orderId: randomUUID(),
      productId,
      variantId: null,
      quantity: 10,
      allowBackorder: true,
      actorId: "actor-1",
      expiresAt: FUTURE,
    });
    expect(reservation.quantity).toBe(10);
  });

  /**
   * The core overselling-prevention guarantee: many orders racing for the
   * same limited stock must never collectively reserve more than what's
   * actually on hand — exactly the concurrency property
   * `firestore-inventory-repository.test.ts` proves for direct `onHand`
   * adjustments, applied here to the `reserved` counter instead.
   */
  it("never oversells under concurrent reservation attempts for the same product", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });

    const attempts = Array.from({ length: 10 }, () =>
      reservations
        .reserve({ orderId: randomUUID(), productId, variantId: null, quantity: 1, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE })
        .then(() => "reserved" as const)
        .catch((error) => {
          if (error instanceof ConflictError) return "rejected" as const;
          throw error;
        }),
    );
    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((outcome) => outcome === "reserved")).toHaveLength(5);
    expect(outcomes.filter((outcome) => outcome === "rejected")).toHaveLength(5);
    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(5);
  }, 20_000);

  it("release() decrements reserved and marks the reservation released; is a no-op on a second call", async () => {
    const productId = randomUUID();
    const orderId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });
    await reservations.reserve({ orderId, productId, variantId: null, quantity: 4, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });

    await reservations.release(orderId, productId, null, "actor-1");
    let record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(0);

    await reservations.release(orderId, productId, null, "actor-1");
    record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(0);
  });

  it("commit() converts the reservation into a permanent onHand deduction and is idempotent", async () => {
    const productId = randomUUID();
    const orderId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });
    await reservations.reserve({ orderId, productId, variantId: null, quantity: 4, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });

    await reservations.commit(orderId, productId, null, "actor-1");
    let record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.onHand).toBe(6);
    expect(record?.reserved).toBe(0);

    // Idempotent no-op the second time.
    await reservations.commit(orderId, productId, null, "actor-1");
    record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.onHand).toBe(6);
  });

  it("commit() throws ConflictError for a reservation that was already released", async () => {
    const productId = randomUUID();
    const orderId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });
    await reservations.reserve({ orderId, productId, variantId: null, quantity: 4, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });
    await reservations.release(orderId, productId, null, "actor-1");

    await expect(reservations.commit(orderId, productId, null, "actor-1")).rejects.toThrow(ConflictError);
  });

  it("commit() throws NotFoundError when no reservation exists at all", async () => {
    await expect(reservations.commit(randomUUID(), randomUUID(), null, "actor-1")).rejects.toThrow(NotFoundError);
  });

  it("reclaims an expired reservation's stock the next time the same product/variant is reserved", async () => {
    const productId = randomUUID();
    await inventory.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });

    const expiredOrderId = randomUUID();
    await reservations.reserve({ orderId: expiredOrderId, productId, variantId: null, quantity: 5, allowBackorder: false, actorId: "actor-1", expiresAt: PAST });

    // Fully reserved and expired — a fresh reservation attempt for the same
    // product/variant should reclaim it rather than being rejected.
    const newOrderId = randomUUID();
    const reservation = await reservations.reserve({
      orderId: newOrderId,
      productId,
      variantId: null,
      quantity: 3,
      allowBackorder: false,
      actorId: "actor-1",
      expiresAt: FUTURE,
    });

    expect(reservation.quantity).toBe(3);
    const record = await inventory.findByProductAndVariant(productId, null);
    expect(record?.reserved).toBe(3);

    const expiredList = await reservations.listByOrder(expiredOrderId);
    expect(expiredList[0]?.status).toBe("released");
  });

  it("listByOrder returns every reservation line for an order", async () => {
    const orderId = randomUUID();
    const productA = randomUUID();
    const productB = randomUUID();
    await inventory.adjust({ productId: productA, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });
    await inventory.adjust({ productId: productB, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });

    await reservations.reserve({ orderId, productId: productA, variantId: null, quantity: 1, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });
    await reservations.reserve({ orderId, productId: productB, variantId: null, quantity: 2, allowBackorder: false, actorId: "actor-1", expiresAt: FUTURE });

    const list = await reservations.listByOrder(orderId);
    expect(list).toHaveLength(2);
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";
import { FirestorePublicInventoryAvailability } from "@/infrastructure/firebase/repositories/firestore-public-inventory-availability";

const adminRepo = new FirestoreInventoryRepository();
const publicAvailability = new FirestorePublicInventoryAvailability();

describe("FirestorePublicInventoryAvailability (emulator)", () => {
  it("is always in stock when the product doesn't track inventory, even with no record at all", async () => {
    const productId = randomUUID();
    const availability = await publicAvailability.getAvailability({
      productId,
      variantId: null,
      allowBackorder: false,
      trackInventory: false,
    });
    expect(availability).toEqual({ inStock: true, lowStock: false });
  });

  it("reflects on-hand minus reserved for a tracked product", async () => {
    const productId = randomUUID();
    await adminRepo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });

    const availability = await publicAvailability.getAvailability({
      productId,
      variantId: null,
      allowBackorder: false,
      trackInventory: true,
    });
    expect(availability).toEqual({ inStock: true, lowStock: false });
  });

  it("is out of stock once available quantity hits zero and backorder is disallowed", async () => {
    const productId = randomUUID();
    await adminRepo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });
    await adminRepo.adjust({ productId, variantId: null, reason: "stock_out", quantityDelta: -5, allowBackorder: false, actorId: "actor-1" });

    const availability = await publicAvailability.getAvailability({
      productId,
      variantId: null,
      allowBackorder: false,
      trackInventory: true,
    });
    expect(availability).toEqual({ inStock: false, lowStock: false });
  });

  it("flags low stock once available quantity drops to the threshold stored on the inventory record", async () => {
    const productId = randomUUID();
    // The threshold lives on the Firestore inventory record itself (set via
    // ensureExists), not on the read-side request — the request's own
    // `lowStockThreshold` field is unused by this port's `getAvailability`.
    await adminRepo.ensureExists(productId, null, 5, "actor-1");
    await adminRepo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 3, allowBackorder: false, actorId: "actor-1" });

    const availability = await publicAvailability.getAvailability({
      productId,
      variantId: null,
      allowBackorder: false,
      trackInventory: true,
    });
    expect(availability).toEqual({ inStock: true, lowStock: true });
  });

  it("never returns onHand/reserved/adjustment history — only the derived booleans", async () => {
    const productId = randomUUID();
    await adminRepo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });

    const availability = await publicAvailability.getAvailability({
      productId,
      variantId: null,
      allowBackorder: false,
      trackInventory: true,
    });
    expect(Object.keys(availability).sort()).toEqual(["inStock", "lowStock"]);
  });

  it("batches multiple requests via getAvailabilityForMany, tracked and untracked mixed", async () => {
    const trackedProductId = randomUUID();
    const untrackedProductId = randomUUID();
    await adminRepo.adjust({
      productId: trackedProductId,
      variantId: null,
      reason: "initial_stock",
      quantityDelta: 1,
      allowBackorder: false,
      actorId: "actor-1",
    });
    await adminRepo.adjust({
      productId: trackedProductId,
      variantId: null,
      reason: "stock_out",
      quantityDelta: -1,
      allowBackorder: false,
      actorId: "actor-1",
    });

    const results = await publicAvailability.getAvailabilityForMany([
      { productId: trackedProductId, variantId: null, allowBackorder: false, trackInventory: true },
      { productId: untrackedProductId, variantId: null, allowBackorder: false, trackInventory: false },
    ]);

    expect(results[0]).toEqual({ inStock: false, lowStock: false });
    expect(results[1]).toEqual({ inStock: true, lowStock: false });
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConflictError } from "@/core/errors";
import { FirestoreInventoryRepository } from "@/infrastructure/firebase/repositories/firestore-inventory-repository";

const repo = new FirestoreInventoryRepository();

describe("FirestoreInventoryRepository (emulator)", () => {
  it("ensureExists is idempotent — a second call doesn't reset an already-adjusted record", async () => {
    const productId = randomUUID();
    await repo.ensureExists(productId, null, 5, "actor-1");
    await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 20, allowBackorder: false, actorId: "actor-1" });

    const again = await repo.ensureExists(productId, null, 5, "actor-1");
    expect(again.onHand).toBe(20);
  });

  it("adjust() increases and decreases on-hand, and the ledger entry records before/after quantities", async () => {
    const productId = randomUUID();
    const first = await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 50, allowBackorder: false, actorId: "actor-1" });
    expect(first.record.onHand).toBe(50);
    expect(first.adjustment.onHandBefore).toBe(0);
    expect(first.adjustment.onHandAfter).toBe(50);

    const second = await repo.adjust({ productId, variantId: null, reason: "stock_out", quantityDelta: -30, allowBackorder: false, actorId: "actor-1", note: "sold" });
    expect(second.record.onHand).toBe(20);
    expect(second.adjustment.onHandBefore).toBe(50);
    expect(second.adjustment.onHandAfter).toBe(20);
    expect(second.adjustment.note).toBe("sold");
  });

  it("refuses a decrease that would take available stock negative when backorder is disallowed", async () => {
    const productId = randomUUID();
    await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });

    await expect(
      repo.adjust({ productId, variantId: null, reason: "stock_out", quantityDelta: -10, allowBackorder: false, actorId: "actor-1" }),
    ).rejects.toThrow(ConflictError);

    // The rejected adjustment must not have partially applied.
    const record = await repo.findByProductAndVariant(productId, null);
    expect(record?.onHand).toBe(5);
  });

  it("allows a decrease that takes on-hand negative when backorder is allowed", async () => {
    const productId = randomUUID();
    await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 2, allowBackorder: true, actorId: "actor-1" });

    const result = await repo.adjust({ productId, variantId: null, reason: "stock_out", quantityDelta: -10, allowBackorder: true, actorId: "actor-1" });
    expect(result.record.onHand).toBe(-8);
  });

  it("tracks a product-level record (variantId: null) separately from its variants' records", async () => {
    const productId = randomUUID();
    const variantId = randomUUID();
    await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 10, allowBackorder: false, actorId: "actor-1" });
    await repo.adjust({ productId, variantId, reason: "initial_stock", quantityDelta: 40, allowBackorder: false, actorId: "actor-1" });

    const productLevel = await repo.findByProductAndVariant(productId, null);
    const variantLevel = await repo.findByProductAndVariant(productId, variantId);
    expect(productLevel?.onHand).toBe(10);
    expect(variantLevel?.onHand).toBe(40);

    const all = await repo.listByProduct(productId);
    expect(all).toHaveLength(2);
  });

  /**
   * The concurrency guarantee this proves: two adjustments racing against
   * the same record must both be reflected in the final total (no lost
   * update) — Firestore transactions retry on contention rather than
   * letting one write silently clobber the other's read-modify-write.
   */
  it("serializes concurrent adjustments to the same record without losing either update", async () => {
    const productId = randomUUID();
    await repo.adjust({ productId, variantId: null, reason: "initial_stock", quantityDelta: 100, allowBackorder: false, actorId: "actor-1" });

    const concurrentAdjustments = Array.from({ length: 10 }, (_, i) =>
      repo.adjust({ productId, variantId: null, reason: "stock_out", quantityDelta: -1, allowBackorder: false, actorId: `actor-${i}` }),
    );
    await Promise.all(concurrentAdjustments);

    const final = await repo.findByProductAndVariant(productId, null);
    expect(final?.onHand).toBe(90);
  }, 20_000);

  it("listLowStock only returns records at or below their own threshold", async () => {
    const lowProductId = randomUUID();
    const healthyProductId = randomUUID();
    await repo.ensureExists(lowProductId, null, 10, "actor-1");
    await repo.adjust({ productId: lowProductId, variantId: null, reason: "initial_stock", quantityDelta: 5, allowBackorder: false, actorId: "actor-1" });
    await repo.ensureExists(healthyProductId, null, 10, "actor-1");
    await repo.adjust({ productId: healthyProductId, variantId: null, reason: "initial_stock", quantityDelta: 500, allowBackorder: false, actorId: "actor-1" });

    const lowStock = await repo.listLowStock(2000);
    const ids = lowStock.map((record) => record.productId);
    expect(ids).toContain(lowProductId);
    expect(ids).not.toContain(healthyProductId);
  });
});

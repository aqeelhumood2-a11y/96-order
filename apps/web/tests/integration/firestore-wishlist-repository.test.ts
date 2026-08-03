import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreWishlistRepository } from "@/infrastructure/firebase/repositories/firestore-wishlist-repository";

const repo = new FirestoreWishlistRepository();

describe("FirestoreWishlistRepository (emulator)", () => {
  it("add() is idempotent — adding the same product/variant twice returns the same row, not a duplicate", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const first = await repo.add(customerUid, "product-1", null);
    const second = await repo.add(customerUid, "product-1", null);

    expect(second.id).toBe(first.id);
    const items = await repo.listByCustomer(customerUid);
    expect(items).toHaveLength(1);
  });

  it("treats different variants of the same product as separate wishlist rows", async () => {
    const customerUid = `customer-${randomUUID()}`;
    await repo.add(customerUid, "product-1", "variant-a");
    await repo.add(customerUid, "product-1", "variant-b");

    const items = await repo.listByCustomer(customerUid);
    expect(items).toHaveLength(2);
  });

  it("remove() is an idempotent no-op when the item isn't wishlisted", async () => {
    const customerUid = `customer-${randomUUID()}`;
    await expect(repo.remove(customerUid, "product-never-added", null)).resolves.toBeUndefined();
  });

  it("remove() deletes an existing item", async () => {
    const customerUid = `customer-${randomUUID()}`;
    await repo.add(customerUid, "product-1", null);
    await repo.remove(customerUid, "product-1", null);

    expect(await repo.listByCustomer(customerUid)).toHaveLength(0);
  });

  it("listByCustomer() never returns another customer's items", async () => {
    const customerUid = `customer-${randomUUID()}`;
    const otherUid = `customer-${randomUUID()}`;
    await repo.add(customerUid, "product-1", null);
    await repo.add(otherUid, "product-2", null);

    const items = await repo.listByCustomer(customerUid);
    expect(items.map((item) => item.productId)).toEqual(["product-1"]);
  });
});

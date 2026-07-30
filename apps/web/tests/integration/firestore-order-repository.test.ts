import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/errors";
import { money } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";

const repo = new FirestoreOrderRepository();

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: randomUUID(),
    orderNumber: `ORD-260130-${randomUUID().slice(0, 6).toUpperCase()}`,
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: `ahmed-${randomUUID().slice(0, 6)}@example.com` },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [
      {
        productId: "product-1",
        variantId: null,
        productName: "Ethiopia Yirgacheffe",
        sku: "ETH-1",
        imageUrl: null,
        unitPrice: money(1899),
        quantity: 2,
        lineTotal: money(3798),
      },
    ],
    subtotal: money(3798),
    shippingFee: money(2000),
    discountTotal: money(0),
    grandTotal: money(5798),
    currency: "BHD",
    paymentMethod: "cash",
    paymentStatus: "cash_pending",
    status: "confirmed",
    source: "web",
    idempotencyKey: randomUUID(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("FirestoreOrderRepository (emulator)", () => {
  it("creates and finds an order by id, order number, and idempotency key", async () => {
    const order = makeOrder();
    await repo.create(order);

    expect(await repo.findById(order.id)).toEqual(order);
    expect(await repo.findByOrderNumber(order.orderNumber)).toEqual(order);
    expect(await repo.findByIdempotencyKey(order.idempotencyKey)).toEqual(order);
  });

  it("rejects a second order that reuses an already-claimed order number", async () => {
    const orderNumber = `ORD-260130-${randomUUID().slice(0, 6).toUpperCase()}`;
    await repo.create(makeOrder({ orderNumber }));

    await expect(repo.create(makeOrder({ orderNumber }))).rejects.toThrow(ConflictError);
  });

  it("update() applies a patch and bumps the version under optimistic concurrency", async () => {
    const order = makeOrder();
    await repo.create(order);

    await repo.update(order.id, { status: "cancelled", cancelledAt: new Date() }, order.version);

    const updated = await repo.findById(order.id);
    expect(updated?.status).toBe("cancelled");
    expect(updated?.version).toBe(order.version + 1);
  });

  it("update() throws ConflictError when expectedVersion is stale", async () => {
    const order = makeOrder();
    await repo.create(order);
    await repo.update(order.id, { status: "cancelled" }, order.version);

    await expect(repo.update(order.id, { status: "confirmed" }, order.version)).rejects.toThrow(ConflictError);
  });

  it("update() throws NotFoundError for a nonexistent order", async () => {
    await expect(repo.update(randomUUID(), { status: "cancelled" }, 1)).rejects.toThrow(NotFoundError);
  });
});

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "@/core/errors";
import { money } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import { buildOrderSearchTokens } from "@/core/orders/rules";
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
    couponCode: null,
    appliedDiscounts: [],
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

  describe("list()", () => {
    it("filters by status", async () => {
      const marker = randomUUID().slice(0, 8);
      const pending = makeOrder({ status: "pending_payment", orderNumber: `ORD-260130-${marker}A` });
      const confirmed = makeOrder({ status: "confirmed", orderNumber: `ORD-260130-${marker}B` });
      await repo.create(pending);
      await repo.create(confirmed);

      const page = await repo.list({ limit: 50, sort: "createdAt", direction: "desc", status: "confirmed" });
      const ids = page.items.map((order) => order.id);
      expect(ids).toContain(confirmed.id);
      expect(ids).not.toContain(pending.id);
    });

    it("filters by a search token built from the order number", async () => {
      const orderNumber = `ORD-260130-${randomUUID().slice(0, 6).toUpperCase()}`;
      const customer = { fullName: "Zara Searchable", mobile: "+97336009999", email: `zara-${randomUUID().slice(0, 6)}@example.com` };
      const order = makeOrder({ orderNumber, customer, searchTokens: buildOrderSearchTokens(orderNumber, customer) });
      await repo.create(order);

      const [primaryToken] = orderNumber.toLowerCase().split("-");
      const page = await repo.list({ limit: 50, sort: "createdAt", direction: "desc", search: `${primaryToken}-260130` });
      expect(page.items.map((item) => item.id)).toContain(order.id);
    });

    it("paginates with a cursor, newest first", async () => {
      const marker = randomUUID().slice(0, 8);
      const first = makeOrder({ orderNumber: `ORD-260130-${marker}1`, status: "preparing" });
      await repo.create(first);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const second = makeOrder({ orderNumber: `ORD-260130-${marker}2`, status: "preparing" });
      await repo.create(second);

      const page1 = await repo.list({ limit: 1, sort: "createdAt", direction: "desc", status: "preparing" });
      expect(page1.items).toHaveLength(1);
      expect(page1.items[0]!.id).toBe(second.id);
      expect(page1.nextCursor).toBe(second.id);

      const page2 = await repo.list({ limit: 1, sort: "createdAt", direction: "desc", status: "preparing", cursor: page1.nextCursor! });
      expect(page2.items[0]!.id).toBe(first.id);
    });
  });

  describe("listByCustomer()", () => {
    it("returns every order for a customer, newest first", async () => {
      const customerId = `customer-${randomUUID()}`;
      const first = makeOrder({ customerId });
      await repo.create(first);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const second = makeOrder({ customerId });
      await repo.create(second);
      await repo.create(makeOrder({ customerId: `other-${randomUUID()}` }));

      const orders = await repo.listByCustomer(customerId, 50);
      expect(orders.map((order) => order.id)).toEqual([second.id, first.id]);
    });
  });
});

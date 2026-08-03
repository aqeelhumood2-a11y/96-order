import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import type { OrderTrackingDeps } from "@/services/orders/dependencies";
import { listOrders } from "@/services/orders/list-orders";
import { makeSession } from "../test-helpers";
import { makeOrder } from "./test-helpers";

function createDeps(): OrderTrackingDeps {
  return { orders: { findById: vi.fn(), findByOrderNumber: vi.fn(), findByIdempotencyKey: vi.fn(), create: vi.fn(), update: vi.fn(), list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }), listByCustomer: vi.fn() } };
}

const baseQuery = { sort: "createdAt" as const, direction: "desc" as const, limit: 25 };

describe("listOrders", () => {
  it("denies an actor without orders:view", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(listOrders(actor, baseQuery, deps)).rejects.toThrow(ForbiddenError);
  });

  it("passes through filters unchanged when there's no search", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:view"]) });
    await listOrders(actor, { ...baseQuery, status: "confirmed" }, deps);
    expect(deps.orders.list).toHaveBeenCalledWith(expect.objectContaining({ status: "confirmed", search: undefined }));
  });

  it("uses the longest query word as the primary Firestore token", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:view"]) });
    await listOrders(actor, { ...baseQuery, search: "ahmed ali" }, deps);
    expect(deps.orders.list).toHaveBeenCalledWith(expect.objectContaining({ search: "ahmed" }));
  });

  it("refines remaining words in-memory over the returned page", async () => {
    const deps = createDeps();
    const matching = makeOrder({ id: "o1", customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "a@example.com" } });
    const nonMatching = makeOrder({ id: "o2", customer: { fullName: "Ahmed Hassan", mobile: "+97336005678", email: "b@example.com" } });
    deps.orders.list = vi.fn().mockResolvedValue({ items: [matching, nonMatching], nextCursor: null });

    const actor = makeSession({ effectivePermissions: new Set(["orders:view"]) });
    const page = await listOrders(actor, { ...baseQuery, search: "ahmed ali" }, deps);

    expect(page.items.map((order) => order.id)).toEqual(["o1"]);
  });
});

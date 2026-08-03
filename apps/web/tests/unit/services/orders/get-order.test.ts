import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { getOrder } from "@/services/orders/get-order";
import { makeSession } from "../test-helpers";
import { createMockOrderManagementDeps, makeOrder } from "./test-helpers";

describe("getOrder", () => {
  it("denies an actor without orders:view", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getOrder(actor, "order-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing order", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:view"]) });
    await expect(getOrder(actor, "order-1", deps)).rejects.toThrow(NotFoundError);
  });

  it("returns the order, its status events sorted oldest-first, and its reservations", async () => {
    const deps = createMockOrderManagementDeps();
    const order = makeOrder();
    deps.orders.findById = vi.fn().mockResolvedValue(order);
    const newer = { id: "e2", orderId: "order-1", fromStatus: "confirmed" as const, toStatus: "preparing" as const, actorId: "staff-1", createdAt: new Date("2026-08-02") };
    const older = { id: "e1", orderId: "order-1", fromStatus: null, toStatus: "confirmed" as const, actorId: "system:checkout", createdAt: new Date("2026-08-01") };
    deps.orderEvents.listByOrder = vi.fn().mockResolvedValue([newer, older]);
    deps.inventory.reservations.listByOrder = vi.fn().mockResolvedValue([
      { id: "r1", orderId: "order-1", productId: "p1", variantId: null, quantity: 1, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);

    const actor = makeSession({ effectivePermissions: new Set(["orders:view"]) });
    const detail = await getOrder(actor, "order-1", deps);

    expect(detail.order).toBe(order);
    expect(detail.events.map((event) => event.id)).toEqual(["e1", "e2"]);
    expect(detail.reservations).toHaveLength(1);
  });
});

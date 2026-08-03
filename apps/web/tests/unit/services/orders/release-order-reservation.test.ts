import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { releaseOrderReservation } from "@/services/orders/release-order-reservation";
import { makeSession } from "../test-helpers";
import { createMockOrderManagementDeps, makeOrder } from "./test-helpers";

describe("releaseOrderReservation", () => {
  it("denies an actor without orders:manage", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(releaseOrderReservation(actor, "order-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing order", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(releaseOrderReservation(actor, "order-1", deps)).rejects.toThrow(NotFoundError);
  });

  it("releases every still-reserved line for the order", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder());
    deps.inventory.reservations.listByOrder = vi.fn().mockResolvedValue([
      { id: "r1", orderId: "order-1", productId: "p1", variantId: null, quantity: 1, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: "r2", orderId: "order-1", productId: "p2", variantId: null, quantity: 1, status: "committed", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);
    const actor = makeSession({ uid: "staff-1", effectivePermissions: new Set(["orders:manage"]) });

    await releaseOrderReservation(actor, "order-1", deps);

    expect(deps.inventory.reservations.release).toHaveBeenCalledTimes(1);
    expect(deps.inventory.reservations.release).toHaveBeenCalledWith("order-1", "p1", null, "staff-1");
  });
});

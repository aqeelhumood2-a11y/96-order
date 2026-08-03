import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import type { InventoryReservationDeps } from "@/services/inventory/dependencies";
import { expireReservations } from "@/services/inventory/expire-reservations";
import { makeSession } from "../test-helpers";

function createDeps(): InventoryReservationDeps {
  return {
    reservations: {
      reserve: vi.fn(),
      release: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn(),
      listByOrder: vi.fn(),
      listExpired: vi.fn().mockResolvedValue([]),
    },
    auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
  };
}

describe("expireReservations", () => {
  it("denies an actor without orders:manage", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(expireReservations(actor, 200, deps)).rejects.toThrow(ForbiddenError);
  });

  it("releases every expired reservation and records one audit entry", async () => {
    const deps = createDeps();
    deps.reservations.listExpired = vi.fn().mockResolvedValue([
      { id: "r1", orderId: "order-1", productId: "p1", variantId: null, quantity: 1, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: "r2", orderId: "order-2", productId: "p2", variantId: "v1", quantity: 2, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });

    const result = await expireReservations(actor, 200, deps);

    expect(result.releasedCount).toBe(2);
    expect(deps.reservations.release).toHaveBeenCalledTimes(2);
    expect(deps.reservations.release).toHaveBeenCalledWith("order-1", "p1", null, "system:reservation_sweep");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "inventory_reservation_expired", metadata: { releasedCount: 2 } }));
  });

  it("is a no-op audit-wise when nothing is expired", async () => {
    const deps = createDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    const result = await expireReservations(actor, 200, deps);
    expect(result.releasedCount).toBe(0);
    expect(deps.auditLogs.record).not.toHaveBeenCalled();
  });
});

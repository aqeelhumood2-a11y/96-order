import { describe, expect, it, vi } from "vitest";
import type { InventoryReservation } from "@/core/catalog/entities";
import { ConflictError, NotFoundError } from "@/core/errors";
import type { InventoryReservationDeps } from "@/services/inventory/dependencies";
import { commitOrderReservations, releaseOrderReservations, reserveOrderLines, type ReservationLineInput } from "@/services/inventory/reservations";

function makeReservation(overrides: Partial<InventoryReservation> = {}): InventoryReservation {
  const now = new Date();
  return {
    id: "order-1:product-1:-",
    orderId: "order-1",
    productId: "product-1",
    variantId: null,
    quantity: 1,
    status: "reserved",
    expiresAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createMockDeps(): InventoryReservationDeps {
  return {
    reservations: {
      reserve: vi.fn(async (input) => makeReservation({ productId: input.productId, variantId: input.variantId, quantity: input.quantity })),
      release: vi.fn().mockResolvedValue(undefined),
      commit: vi.fn().mockResolvedValue(undefined),
      listByOrder: vi.fn().mockResolvedValue([]),
    },
    auditLogs: {
      record: vi.fn().mockResolvedValue(undefined),
      list: vi.fn(),
    },
  };
}

const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

describe("reserveOrderLines", () => {
  it("reserves every line and records a single audit log entry", async () => {
    const deps = createMockDeps();
    const lines: ReservationLineInput[] = [
      { productId: "product-1", variantId: null, quantity: 2, allowBackorder: false, trackInventory: true },
      { productId: "product-2", variantId: "v1", quantity: 1, allowBackorder: false, trackInventory: true },
    ];

    await reserveOrderLines("order-1", lines, expiresAt, "system", deps);

    expect(deps.reservations.reserve).toHaveBeenCalledTimes(2);
    expect(deps.reservations.release).not.toHaveBeenCalled();
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "inventory_reserved", actorUid: null, metadata: { orderId: "order-1", lineCount: 2 } }),
    );
  });

  it("rolls back every already-reserved line when a later line fails", async () => {
    const deps = createMockDeps();
    deps.reservations.reserve = vi
      .fn()
      .mockImplementationOnce(async (input) => makeReservation({ productId: input.productId, variantId: input.variantId }))
      .mockImplementationOnce(async () => {
        throw new ConflictError("Not enough available stock to reserve this quantity.");
      });

    const lines: ReservationLineInput[] = [
      { productId: "product-1", variantId: null, quantity: 2, allowBackorder: false, trackInventory: true },
      { productId: "product-2", variantId: null, quantity: 100, allowBackorder: false, trackInventory: true },
    ];

    await expect(reserveOrderLines("order-1", lines, expiresAt, "system", deps)).rejects.toThrow(ConflictError);

    expect(deps.reservations.release).toHaveBeenCalledTimes(1);
    expect(deps.reservations.release).toHaveBeenCalledWith("order-1", "product-1", null, "system");
    expect(deps.auditLogs.record).not.toHaveBeenCalled();
  });

  it("skips lines that don't track inventory — there is nothing to reserve for unlimited stock", async () => {
    const deps = createMockDeps();
    const lines: ReservationLineInput[] = [
      { productId: "product-1", variantId: null, quantity: 2, allowBackorder: false, trackInventory: true },
      { productId: "product-2", variantId: null, quantity: 5, allowBackorder: false, trackInventory: false },
    ];

    await reserveOrderLines("order-1", lines, expiresAt, "system", deps);

    expect(deps.reservations.reserve).toHaveBeenCalledTimes(1);
    expect(deps.reservations.reserve).toHaveBeenCalledWith(expect.objectContaining({ productId: "product-1" }));
  });
});

describe("releaseOrderReservations", () => {
  it("releases only the lines still in the reserved state", async () => {
    const deps = createMockDeps();
    deps.reservations.listByOrder = vi
      .fn()
      .mockResolvedValue([
        makeReservation({ productId: "product-1", status: "reserved" }),
        makeReservation({ productId: "product-2", status: "committed" }),
      ]);

    await releaseOrderReservations("order-1", "system", deps);

    expect(deps.reservations.release).toHaveBeenCalledTimes(1);
    expect(deps.reservations.release).toHaveBeenCalledWith("order-1", "product-1", null, "system");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "inventory_reservation_released", actorUid: null, metadata: { orderId: "order-1" } }),
    );
  });

  it("is a no-op when there is nothing left to release", async () => {
    const deps = createMockDeps();
    deps.reservations.listByOrder = vi.fn().mockResolvedValue([makeReservation({ status: "released" })]);

    await releaseOrderReservations("order-1", "system", deps);

    expect(deps.reservations.release).not.toHaveBeenCalled();
  });
});

describe("commitOrderReservations", () => {
  it("commits only the lines still in the reserved state", async () => {
    const deps = createMockDeps();
    deps.reservations.listByOrder = vi
      .fn()
      .mockResolvedValue([
        makeReservation({ productId: "product-1", status: "reserved" }),
        makeReservation({ productId: "product-2", status: "committed" }),
      ]);

    await commitOrderReservations("order-1", "system", deps);

    expect(deps.reservations.commit).toHaveBeenCalledTimes(1);
    expect(deps.reservations.commit).toHaveBeenCalledWith("order-1", "product-1", null, "system");
  });

  it("throws when the order has no reservations at all", async () => {
    const deps = createMockDeps();
    deps.reservations.listByOrder = vi.fn().mockResolvedValue([]);

    await expect(commitOrderReservations("order-1", "system", deps)).rejects.toThrow(NotFoundError);
  });

  it("is idempotent — committing an already-committed order is a no-op", async () => {
    const deps = createMockDeps();
    deps.reservations.listByOrder = vi.fn().mockResolvedValue([makeReservation({ status: "committed" })]);

    await commitOrderReservations("order-1", "system", deps);

    expect(deps.reservations.commit).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { confirmOrderPayment } from "@/services/orders/confirm-order-payment";
import { makeSession } from "../test-helpers";
import { createMockOrderManagementDeps, makeOrder } from "./test-helpers";

describe("confirmOrderPayment", () => {
  it("denies an actor without payments:manage", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing order", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects a non-tap order", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "cash" }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("throws ConflictError on a version mismatch", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "tap", paymentStatus: "pending", version: 2 }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps)).rejects.toThrow(ConflictError);
  });

  it("is idempotent when already paid", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "tap", paymentStatus: "paid", version: 1 }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    const result = await confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps);
    expect(result.paymentStatus).toBe("paid");
    expect(deps.orders.update).not.toHaveBeenCalled();
  });

  it("rejects a payment status that isn't pending/authorized", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "tap", paymentStatus: "failed", version: 1 }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps)).rejects.toThrow(ConflictError);
  });

  it("commits reservations and confirms the order", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "pending_payment", paymentMethod: "tap", paymentStatus: "pending", version: 1 }));
    deps.inventory.reservations.listByOrder = vi.fn().mockResolvedValue([
      { id: "r1", orderId: "order-1", productId: "p1", variantId: null, quantity: 1, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);
    const actor = makeSession({ uid: "staff-1", effectivePermissions: new Set(["payments:manage"]) });

    const result = await confirmOrderPayment(actor, { orderId: "order-1", expectedVersion: 1 }, deps);

    expect(result.status).toBe("confirmed");
    expect(result.paymentStatus).toBe("paid");
    expect(deps.inventory.reservations.commit).toHaveBeenCalledWith("order-1", "p1", null, "staff-1");
    expect(deps.orders.update).toHaveBeenCalledWith("order-1", { status: "confirmed", paymentStatus: "paid" }, 1);
    expect(deps.orderEvents.record).toHaveBeenCalled();
  });
});

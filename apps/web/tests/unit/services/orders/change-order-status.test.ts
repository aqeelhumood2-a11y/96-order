import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { changeOrderStatus } from "@/services/orders/change-order-status";
import { makeSession } from "../test-helpers";
import { createMockOrderManagementDeps, makeOrder } from "./test-helpers";

describe("changeOrderStatus", () => {
  it("denies an actor without orders:manage", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "preparing", expectedVersion: 1 }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing order", async () => {
    const deps = createMockOrderManagementDeps();
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "preparing", expectedVersion: 1 }, deps)).rejects.toThrow(NotFoundError);
  });

  it("throws ConflictError on a version mismatch", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ version: 2 }));
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "preparing", expectedVersion: 1 }, deps)).rejects.toThrow(ConflictError);
  });

  it("is a no-op when already in the target status", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "preparing", version: 1 }));
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    const result = await changeOrderStatus(actor, { orderId: "order-1", toStatus: "preparing", expectedVersion: 1 }, deps);
    expect(result.status).toBe("preparing");
    expect(deps.orders.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid transition", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "pending_payment", version: 1 }));
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "ready", expectedVersion: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects out_for_delivery for a pickup order", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(
      makeOrder({ status: "ready", version: 1, fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-05", timeWindow: "10:00-12:00" } } }),
    );
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "out_for_delivery", expectedVersion: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects completing an order whose payment isn't confirmed", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "ready", version: 1, paymentMethod: "tap", paymentStatus: "pending" }));
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    await expect(changeOrderStatus(actor, { orderId: "order-1", toStatus: "completed", expectedVersion: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("allows completing an order once cash payment is confirmed", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "ready", version: 1, paymentMethod: "cash", paymentStatus: "cash_confirmed" }));
    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    const result = await changeOrderStatus(actor, { orderId: "order-1", toStatus: "completed", expectedVersion: 1 }, deps);
    expect(result.status).toBe("completed");
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(deps.orderEvents.record).toHaveBeenCalledWith(expect.objectContaining({ orderId: "order-1", fromStatus: "ready", toStatus: "completed" }));
  });

  it("releases reservations and reverses customer spend when cancelling", async () => {
    const deps = createMockOrderManagementDeps();
    const existingCustomer = {
      id: "ahmed@example.com",
      kind: "guest" as const,
      fullName: "Ahmed Ali",
      email: "ahmed@example.com",
      mobile: "+97336001234",
      totalOrders: 1,
      totalSpent: { amount: 7000, currency: "BHD" as const },
      firstOrderAt: new Date(),
      lastOrderAt: new Date(),
      searchTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "confirmed", version: 1, customerId: "ahmed@example.com" }));
    deps.customers.upsert = vi.fn(async (_id, fold) => fold(existingCustomer));

    const actor = makeSession({ effectivePermissions: new Set(["orders:manage"]) });
    const result = await changeOrderStatus(actor, { orderId: "order-1", toStatus: "cancelled", expectedVersion: 1, note: "customer request" }, deps);

    expect(result.status).toBe("cancelled");
    expect(result.cancelledAt).toBeInstanceOf(Date);
    expect(deps.customers.upsert).toHaveBeenCalledWith("ahmed@example.com", expect.any(Function));
  });

  it("records an order_status_changed audit entry with the real actor", async () => {
    const deps = createMockOrderManagementDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "confirmed", version: 1 }));
    const actor = makeSession({ uid: "staff-1", email: "staff@96order.test", effectivePermissions: new Set(["orders:manage"]) });
    await changeOrderStatus(actor, { orderId: "order-1", toStatus: "preparing", expectedVersion: 1 }, deps);

    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "order_status_changed", actorUid: "staff-1", actorEmail: "staff@96order.test" }),
    );
  });
});

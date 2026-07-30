import { describe, expect, it, vi } from "vitest";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { confirmCashPayment } from "@/services/payments/confirm-cash-payment";
import { createMockPaymentOrchestrationDeps, makeOrder } from "./test-helpers";
import { makeSession } from "../test-helpers";

describe("confirmCashPayment", () => {
  it("denies an actor without payments:manage", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(confirmCashPayment(actor, "order-1", deps)).rejects.toThrow(ForbiddenError);
  });

  it("throws NotFoundError for a missing order", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmCashPayment(actor, "order-1", deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects a non-cash order", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "tap" }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmCashPayment(actor, "order-1", deps)).rejects.toThrow(ValidationError);
  });

  it("rejects an order whose cash payment isn't pending", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "cash", paymentStatus: "failed" }));
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });
    await expect(confirmCashPayment(actor, "order-1", deps)).rejects.toThrow(ConflictError);
  });

  it("is idempotent — confirming an already-confirmed cash order returns it unchanged", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    const order = makeOrder({ paymentMethod: "cash", paymentStatus: "cash_confirmed" });
    deps.orders.findById = vi.fn().mockResolvedValue(order);
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });

    const result = await confirmCashPayment(actor, "order-1", deps);

    expect(result).toBe(order);
    expect(deps.inventory.reservations.commit).not.toHaveBeenCalled();
    expect(deps.orders.update).not.toHaveBeenCalled();
  });

  it("commits the reservation, confirms payment, and sends a confirmation email on the happy path", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ paymentMethod: "cash", paymentStatus: "cash_pending" }));
    deps.payments.payments.findByOrderId = vi.fn().mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      method: "cash",
      status: "cash_pending",
      amount: { amount: 7000, currency: "BHD" },
      currency: "BHD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const actor = makeSession({ effectivePermissions: new Set(["payments:manage"]) });

    const result = await confirmCashPayment(actor, "order-1", deps);

    expect(deps.inventory.reservations.commit).toHaveBeenCalledWith("order-1", "product-1", null, actor.uid);
    expect(deps.payments.payments.update).toHaveBeenCalledWith("payment-1", { status: "cash_confirmed" });
    expect(deps.orders.update).toHaveBeenCalledWith("order-1", { paymentStatus: "cash_confirmed" }, 1);
    expect(deps.payments.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "cash_payment_confirmed", actorUid: actor.uid }));
    expect(deps.email.email.send).toHaveBeenCalledWith(expect.objectContaining({ template: "payment_confirmation" }));
    expect(result.paymentStatus).toBe("cash_confirmed");
  });
});

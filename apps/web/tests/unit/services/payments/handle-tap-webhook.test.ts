import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/core/errors";
import { handleTapWebhook } from "@/services/payments/handle-tap-webhook";
import { createMockPaymentOrchestrationDeps, makeOrder } from "./test-helpers";

const RAW_BODY = JSON.stringify({ id: "chg_1", status: "CAPTURED" });

function mockEvent(deps: ReturnType<typeof createMockPaymentOrchestrationDeps>, status: "pending" | "authorized" | "paid" | "failed" | "cancelled") {
  deps.payments.provider.parseWebhookEvent = vi.fn().mockReturnValue({
    eventId: `chg_1:${status}`,
    eventType: `charge.${status}`,
    providerReference: "chg_1",
    status,
  });
}

describe("handleTapWebhook", () => {
  it("throws UnauthorizedError on an invalid signature and does nothing else", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    deps.payments.provider.verifyWebhookSignature = vi.fn().mockReturnValue(false);

    await expect(handleTapWebhook(RAW_BODY, "bad-signature", deps)).rejects.toThrow(UnauthorizedError);
    expect(deps.payments.webhookEvents.record).not.toHaveBeenCalled();
  });

  it("is a no-op for a redelivered (already-processed) event", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    mockEvent(deps, "paid");
    deps.payments.webhookEvents.findById = vi.fn().mockResolvedValue({
      id: "chg_1:paid",
      provider: "tap",
      paymentId: "payment-1",
      eventType: "charge.paid",
      receivedAt: new Date(),
      processedAt: new Date(),
    });

    await handleTapWebhook(RAW_BODY, "sig", deps);

    expect(deps.payments.webhookEvents.record).not.toHaveBeenCalled();
    expect(deps.payments.payments.update).not.toHaveBeenCalled();
    expect(deps.orders.update).not.toHaveBeenCalled();
  });

  it("records the event and stops when no local payment matches the charge", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    mockEvent(deps, "paid");

    await handleTapWebhook(RAW_BODY, "sig", deps);

    expect(deps.payments.webhookEvents.record).toHaveBeenCalledWith(expect.objectContaining({ id: "chg_1:paid", paymentId: null }));
    expect(deps.payments.webhookEvents.markProcessed).toHaveBeenCalledWith("chg_1:paid", expect.any(Date));
    expect(deps.orders.update).not.toHaveBeenCalled();
  });

  it("commits the reservation and confirms the order on a paid event", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    mockEvent(deps, "paid");
    deps.payments.payments.findByProviderReference = vi.fn().mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      method: "tap",
      status: "pending",
      amount: { amount: 7000, currency: "BHD" },
      currency: "BHD",
      providerReference: "chg_1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "pending_payment" }));

    await handleTapWebhook(RAW_BODY, "sig", deps);

    expect(deps.payments.payments.update).toHaveBeenCalledWith("payment-1", { status: "paid" });
    expect(deps.inventory.reservations.commit).toHaveBeenCalledWith("order-1", "product-1", null, "system:tap_webhook");
    expect(deps.orders.update).toHaveBeenCalledWith("order-1", { status: "confirmed", paymentStatus: "paid" }, 1);
    expect(deps.email.email.send).toHaveBeenCalledWith(expect.objectContaining({ template: "payment_confirmation" }));
  });

  it("releases the reservation and cancels the order on a failed event", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    mockEvent(deps, "failed");
    deps.payments.payments.findByProviderReference = vi.fn().mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      method: "tap",
      status: "pending",
      amount: { amount: 7000, currency: "BHD" },
      currency: "BHD",
      providerReference: "chg_1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "pending_payment" }));

    await handleTapWebhook(RAW_BODY, "sig", deps);

    expect(deps.inventory.reservations.release).toHaveBeenCalledWith("order-1", "product-1", null, "system:tap_webhook");
    expect(deps.orders.update).toHaveBeenCalledWith("order-1", { status: "cancelled", paymentStatus: "failed", cancelledAt: expect.any(Date) }, 1);
    expect(deps.email.email.send).toHaveBeenCalledWith(expect.objectContaining({ template: "payment_failure" }));
  });

  it("does not re-trigger a transition for an order that already left pending_payment", async () => {
    const deps = createMockPaymentOrchestrationDeps();
    mockEvent(deps, "failed");
    deps.payments.payments.findByProviderReference = vi.fn().mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      method: "tap",
      status: "paid",
      amount: { amount: 7000, currency: "BHD" },
      currency: "BHD",
      providerReference: "chg_1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    deps.orders.findById = vi.fn().mockResolvedValue(makeOrder({ status: "confirmed", paymentStatus: "paid" }));

    await handleTapWebhook(RAW_BODY, "sig", deps);

    expect(deps.inventory.reservations.release).not.toHaveBeenCalled();
    expect(deps.orders.update).not.toHaveBeenCalled();
    expect(deps.payments.payments.update).toHaveBeenCalledWith("payment-1", { status: "failed" });
  });
});

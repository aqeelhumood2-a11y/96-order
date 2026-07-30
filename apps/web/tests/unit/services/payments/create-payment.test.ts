import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors";
import { money } from "@/core/money/money";
import type { PaymentDeps } from "@/services/payments/dependencies";
import { createPayment } from "@/services/payments/create-payment";

function createMockDeps(): PaymentDeps {
  return {
    payments: { findById: vi.fn(), findByOrderId: vi.fn(), findByProviderReference: vi.fn(), create: vi.fn().mockResolvedValue(undefined), update: vi.fn().mockResolvedValue(undefined) },
    webhookEvents: { findById: vi.fn(), record: vi.fn(), markProcessed: vi.fn() },
    provider: {
      createCharge: vi.fn().mockResolvedValue({ providerReference: "chg_1", redirectUrl: "https://pay.example/chg_1" }),
      verifyWebhookSignature: vi.fn(),
      parseWebhookEvent: vi.fn(),
      retrieveCharge: vi.fn(),
    },
    auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
  };
}

describe("createPayment", () => {
  it("creates a cash_pending payment with no provider call for cash", async () => {
    const deps = createMockDeps();
    const { payment, redirectUrl } = await createPayment(
      { orderId: "order-1", orderNumber: "ORD-1", method: "cash", amount: money(5000), customerEmail: "a@example.com", customerName: "A" },
      deps,
    );

    expect(payment.status).toBe("cash_pending");
    expect(redirectUrl).toBeUndefined();
    expect(deps.provider.createCharge).not.toHaveBeenCalled();
    expect(deps.payments.create).toHaveBeenCalledTimes(1);
  });

  it("requires a returnUrl for tap", async () => {
    const deps = createMockDeps();
    await expect(
      createPayment({ orderId: "order-1", orderNumber: "ORD-1", method: "tap", amount: money(5000), customerEmail: "a@example.com", customerName: "A" }, deps),
    ).rejects.toThrow(ValidationError);
  });

  it("creates a pending payment, opens a Tap charge, and records the provider reference", async () => {
    const deps = createMockDeps();
    const { payment, redirectUrl } = await createPayment(
      {
        orderId: "order-1",
        orderNumber: "ORD-1",
        method: "tap",
        amount: money(5000),
        customerEmail: "a@example.com",
        customerName: "A",
        returnUrl: "https://example.com/checkout/success",
      },
      deps,
    );

    expect(payment.status).toBe("pending");
    expect(payment.providerReference).toBe("chg_1");
    expect(redirectUrl).toBe("https://pay.example/chg_1");
    expect(deps.payments.update).toHaveBeenCalledWith(payment.id, { providerReference: "chg_1" });
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "payment_started", actorUid: null }));
  });
});

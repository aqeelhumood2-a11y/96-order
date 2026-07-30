import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TapPaymentProvider } from "@/infrastructure/payments/tap/tap-payment-provider";

const ORIGINAL_ENV = process.env.TAP_SECRET_KEY;

function signCharge(secretKey: string, charge: { id: string; amount: number; currency: string; status: string }): string {
  const toSign = `x_id${charge.id}x_amount${charge.amount}x_currency${charge.currency}x_status${charge.status}`;
  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}

describe("TapPaymentProvider.verifyWebhookSignature", () => {
  beforeEach(() => {
    process.env.TAP_SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    process.env.TAP_SECRET_KEY = ORIGINAL_ENV;
  });

  it("accepts a correctly signed body", () => {
    const provider = new TapPaymentProvider();
    const charge = { id: "chg_123", amount: 18.99, currency: "BHD", status: "CAPTURED" };
    const rawBody = JSON.stringify(charge);
    const signature = signCharge("test-secret-key", charge);

    expect(provider.verifyWebhookSignature(rawBody, signature)).toBe(true);
  });

  it("rejects a body signed with the wrong secret", () => {
    const provider = new TapPaymentProvider();
    const charge = { id: "chg_123", amount: 18.99, currency: "BHD", status: "CAPTURED" };
    const rawBody = JSON.stringify(charge);
    const signature = signCharge("a-different-secret", charge);

    expect(provider.verifyWebhookSignature(rawBody, signature)).toBe(false);
  });

  it("rejects a tampered body (amount changed after signing)", () => {
    const provider = new TapPaymentProvider();
    const charge = { id: "chg_123", amount: 18.99, currency: "BHD", status: "CAPTURED" };
    const signature = signCharge("test-secret-key", charge);
    const tamperedBody = JSON.stringify({ ...charge, amount: 999 });

    expect(provider.verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const provider = new TapPaymentProvider();
    expect(provider.verifyWebhookSignature(JSON.stringify({ id: "chg_1", status: "CAPTURED" }), null)).toBe(false);
  });

  it("rejects malformed JSON without throwing", () => {
    const provider = new TapPaymentProvider();
    expect(provider.verifyWebhookSignature("not json", "deadbeef")).toBe(false);
  });

  it("rejects a non-hex signature header without throwing", () => {
    const provider = new TapPaymentProvider();
    const rawBody = JSON.stringify({ id: "chg_1", amount: 5, currency: "BHD", status: "CAPTURED" });
    expect(provider.verifyWebhookSignature(rawBody, "not-hex-!!")).toBe(false);
  });
});

describe("TapPaymentProvider.parseWebhookEvent", () => {
  it("normalizes a captured charge to paid", () => {
    const provider = new TapPaymentProvider();
    const event = provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status: "CAPTURED" }));
    expect(event).toEqual({ eventId: "chg_1:CAPTURED", eventType: "charge.captured", providerReference: "chg_1", status: "paid" });
  });

  it("normalizes declined/failed/restricted/timedout to failed", () => {
    const provider = new TapPaymentProvider();
    for (const status of ["DECLINED", "FAILED", "RESTRICTED", "TIMEDOUT"]) {
      expect(provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status })).status).toBe("failed");
    }
  });

  it("normalizes abandoned/cancelled/void to cancelled", () => {
    const provider = new TapPaymentProvider();
    for (const status of ["ABANDONED", "CANCELLED", "VOID"]) {
      expect(provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status })).status).toBe("cancelled");
    }
  });

  it("normalizes authorized to authorized", () => {
    const provider = new TapPaymentProvider();
    expect(provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status: "AUTHORIZED" })).status).toBe("authorized");
  });

  it("distinguishes redelivery of the same status from a genuine progression", () => {
    const provider = new TapPaymentProvider();
    const initiated = provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status: "INITIATED" }));
    const capturedAgain = provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status: "INITIATED" }));
    const captured = provider.parseWebhookEvent(JSON.stringify({ id: "chg_1", status: "CAPTURED" }));

    expect(initiated.eventId).toBe(capturedAgain.eventId); // same status redelivered -> same idempotency key
    expect(initiated.eventId).not.toBe(captured.eventId); // genuine progression -> different key
  });
});

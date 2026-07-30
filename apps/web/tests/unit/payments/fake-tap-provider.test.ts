import { describe, expect, it } from "vitest";
import { FakeTapProvider } from "@/infrastructure/payments/tap/fake-tap-provider";
import { money } from "@/core/money/money";

describe("FakeTapProvider", () => {
  it("creates a charge with a redirect URL", async () => {
    const provider = new FakeTapProvider();
    const result = await provider.createCharge({
      orderId: "order-1",
      orderNumber: "ORD-260130-ABCDEF",
      amount: money(1899),
      customerEmail: "shopper@example.com",
      customerName: "Shopper",
      returnUrl: "https://example.com/checkout/success",
    });

    expect(result.providerReference).toMatch(/^chg_fake_/);
    expect(result.redirectUrl).toContain(result.providerReference);
  });

  it("round-trips a simulated webhook through parseWebhookEvent", async () => {
    const provider = new FakeTapProvider();
    const { providerReference } = await provider.createCharge({
      orderId: "order-1",
      orderNumber: "ORD-260130-ABCDEF",
      amount: money(1899),
      customerEmail: "shopper@example.com",
      customerName: "Shopper",
      returnUrl: "https://example.com/checkout/success",
    });

    const body = provider.buildWebhookBody(providerReference, "paid");
    const event = provider.parseWebhookEvent(body);

    expect(event.status).toBe("paid");
    expect(event.providerReference).toBe(providerReference);
  });

  it("reflects the simulated status via retrieveCharge (reconciliation path)", async () => {
    const provider = new FakeTapProvider();
    const { providerReference } = await provider.createCharge({
      orderId: "order-1",
      orderNumber: "ORD-260130-ABCDEF",
      amount: money(1899),
      customerEmail: "shopper@example.com",
      customerName: "Shopper",
      returnUrl: "https://example.com/checkout/success",
    });

    expect((await provider.retrieveCharge(providerReference)).status).toBe("pending");
    provider.buildWebhookBody(providerReference, "paid");
    expect((await provider.retrieveCharge(providerReference)).status).toBe("paid");
  });

  it("always verifies its own webhook signature (fake transport, no real signing)", () => {
    const provider = new FakeTapProvider();
    expect(provider.verifyWebhookSignature("anything", null)).toBe(true);
  });

  it("throws when retrieving or building a webhook for an unknown charge", async () => {
    const provider = new FakeTapProvider();
    await expect(provider.retrieveCharge("chg_fake_does-not-exist")).rejects.toThrow();
    expect(() => provider.buildWebhookBody("chg_fake_does-not-exist", "paid")).toThrow();
  });
});

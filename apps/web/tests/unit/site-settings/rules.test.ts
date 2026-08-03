import { describe, expect, it } from "vitest";
import { defaultPaymentProviderSettings, isPaymentMethodEnabled, type PaymentProviderSettings } from "@/core/site-settings/entities";

describe("isPaymentMethodEnabled", () => {
  it("allows everything by default", () => {
    const providers = defaultPaymentProviderSettings();
    expect(isPaymentMethodEnabled("tap", "delivery", providers)).toBe(true);
    expect(isPaymentMethodEnabled("cash", "delivery", providers)).toBe(true);
    expect(isPaymentMethodEnabled("cash", "pickup", providers)).toBe(true);
  });

  it("gates tap on tapEnabled regardless of fulfillment method", () => {
    const providers: PaymentProviderSettings = { tapEnabled: false, cashOnDeliveryEnabled: true, cashOnPickupEnabled: true };
    expect(isPaymentMethodEnabled("tap", "delivery", providers)).toBe(false);
    expect(isPaymentMethodEnabled("tap", "pickup", providers)).toBe(false);
  });

  it("gates cash independently by fulfillment method", () => {
    const providers: PaymentProviderSettings = { tapEnabled: true, cashOnDeliveryEnabled: true, cashOnPickupEnabled: false };
    expect(isPaymentMethodEnabled("cash", "delivery", providers)).toBe(true);
    expect(isPaymentMethodEnabled("cash", "pickup", providers)).toBe(false);
  });
});

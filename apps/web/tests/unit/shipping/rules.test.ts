import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import {
  computeFreeShippingUpsell,
  computeShippingFee,
  formatFreeShippingUpsellMessage,
  FREE_SHIPPING_THRESHOLD,
  REDUCED_SHIPPING_FEE,
  REDUCED_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/core/shipping/rules";

describe("computeShippingFee", () => {
  it("charges the standard fee for a subtotal well below the reduced threshold", () => {
    expect(computeShippingFee(money(5_000))).toEqual(STANDARD_SHIPPING_FEE);
  });

  it("charges the standard fee at exactly BHD 10.000 (boundary is strict 'above')", () => {
    expect(computeShippingFee(REDUCED_SHIPPING_THRESHOLD)).toEqual(STANDARD_SHIPPING_FEE);
  });

  it("charges the reduced fee just above BHD 10.000", () => {
    expect(computeShippingFee(money(10_001))).toEqual(REDUCED_SHIPPING_FEE);
  });

  it("charges the reduced fee at exactly BHD 30.000 (boundary is strict 'above')", () => {
    expect(computeShippingFee(FREE_SHIPPING_THRESHOLD)).toEqual(REDUCED_SHIPPING_FEE);
  });

  it("is free just above BHD 30.000", () => {
    expect(computeShippingFee(money(30_001)).amount).toBe(0);
  });

  it("charges the reduced fee anywhere strictly between the two thresholds", () => {
    expect(computeShippingFee(money(20_000))).toEqual(REDUCED_SHIPPING_FEE);
  });

  it("is free for a subtotal well above the free threshold", () => {
    expect(computeShippingFee(money(100_000)).amount).toBe(0);
  });

  it("charges the standard fee for a zero subtotal", () => {
    expect(computeShippingFee(money(0))).toEqual(STANDARD_SHIPPING_FEE);
  });
});

describe("computeFreeShippingUpsell", () => {
  it("is not achieved and reports the distance to the threshold below BHD 10.000", () => {
    const upsell = computeFreeShippingUpsell(money(5_000));
    expect(upsell.achieved).toBe(false);
    expect(upsell.remaining).toEqual(money(25_001));
  });

  it("is not achieved at exactly BHD 30.000 (fee is still charged there)", () => {
    const upsell = computeFreeShippingUpsell(FREE_SHIPPING_THRESHOLD);
    expect(upsell.achieved).toBe(false);
    expect(upsell.remaining).toEqual(money(1));
  });

  it("is achieved just above BHD 30.000", () => {
    const upsell = computeFreeShippingUpsell(money(30_001));
    expect(upsell.achieved).toBe(true);
    expect(upsell.remaining.amount).toBe(0);
  });

  it("is achieved well above the free threshold", () => {
    expect(computeFreeShippingUpsell(money(100_000)).achieved).toBe(true);
  });
});

describe("formatFreeShippingUpsellMessage", () => {
  it("returns a formatted message when not yet achieved", () => {
    expect(formatFreeShippingUpsellMessage(money(28_000))).toBe("Add 2.001 BHD more to get free delivery");
  });

  it("returns null once free shipping is achieved", () => {
    expect(formatFreeShippingUpsellMessage(money(30_001))).toBeNull();
  });
});

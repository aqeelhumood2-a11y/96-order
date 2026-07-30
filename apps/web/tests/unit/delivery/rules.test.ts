import { describe, expect, it } from "vitest";
import type { DeliveryAddress } from "@/core/delivery/entities";
import { isSupportedDeliveryCountry, isValidDeliveryAddress } from "@/core/delivery/rules";

function makeAddress(overrides: Partial<DeliveryAddress> = {}): DeliveryAddress {
  return { country: "BH", area: "Manama", block: "304", road: "1502", building: "96", ...overrides };
}

describe("isSupportedDeliveryCountry", () => {
  it("supports Bahrain", () => {
    expect(isSupportedDeliveryCountry("BH")).toBe(true);
  });

  it("rejects any other country", () => {
    expect(isSupportedDeliveryCountry("SA")).toBe(false);
    expect(isSupportedDeliveryCountry("")).toBe(false);
  });
});

describe("isValidDeliveryAddress", () => {
  it("accepts a complete Bahrain address", () => {
    expect(isValidDeliveryAddress(makeAddress())).toBe(true);
  });

  it("accepts optional fields being absent", () => {
    expect(isValidDeliveryAddress(makeAddress({ flat: undefined, landmark: undefined, instructions: undefined }))).toBe(true);
  });

  it("rejects an unsupported country", () => {
    expect(isValidDeliveryAddress(makeAddress({ country: "US" }))).toBe(false);
  });

  it.each(["area", "block", "road", "building"] as const)("rejects a blank %s", (field) => {
    expect(isValidDeliveryAddress(makeAddress({ [field]: "   " }))).toBe(false);
  });
});

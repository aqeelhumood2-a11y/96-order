import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors";
import { validateCustomer, validateFulfillment } from "@/services/checkout/validation";

describe("validateCustomer", () => {
  const base = { fullName: "Ahmed Ali", mobile: "36001234", email: "ahmed@example.com" };

  it("normalizes the mobile number and lowercases the email", () => {
    const result = validateCustomer({ ...base, email: "Ahmed@Example.com" });
    expect(result.mobile).toBe("+97336001234");
    expect(result.email).toBe("ahmed@example.com");
  });

  it("trims optional fields to undefined when blank", () => {
    const result = validateCustomer({ ...base, companyName: "  ", note: "   " });
    expect(result.companyName).toBeUndefined();
    expect(result.note).toBeUndefined();
  });

  it("rejects a too-short full name", () => {
    expect(() => validateCustomer({ ...base, fullName: "A" })).toThrow(ValidationError);
  });

  it("rejects an invalid Bahrain mobile number", () => {
    expect(() => validateCustomer({ ...base, mobile: "123" })).toThrow(ValidationError);
  });

  it("rejects an invalid email", () => {
    expect(() => validateCustomer({ ...base, email: "not-an-email" })).toThrow(ValidationError);
  });
});

describe("validateFulfillment", () => {
  const now = new Date("2026-07-30T08:00:00Z");
  const availableSchedule = { date: now.toISOString().slice(0, 10), timeWindow: "16:00-18:00" as const };

  it("builds a delivery fulfillment from a valid address and schedule", () => {
    const result = validateFulfillment(
      {
        fulfillmentMethod: "delivery",
        deliveryAddress: { country: "BH", area: "Manama", block: "304", road: "1502", building: "96" },
        schedule: availableSchedule,
      },
      now,
    );
    expect(result.method).toBe("delivery");
  });

  it("rejects delivery without a valid address", () => {
    expect(() =>
      validateFulfillment({ fulfillmentMethod: "delivery", schedule: availableSchedule }, now),
    ).toThrow(ValidationError);
  });

  it("builds a pickup fulfillment using the configured placeholder location", () => {
    const result = validateFulfillment(
      { fulfillmentMethod: "pickup", pickupInstructions: "Call on arrival", schedule: availableSchedule },
      now,
    );
    expect(result.method).toBe("pickup");
    if (result.method === "pickup") {
      expect(result.pickup.instructions).toBe("Call on arrival");
      expect(result.pickup.locationId).toBeTruthy();
    }
  });

  it("rejects an unavailable schedule", () => {
    expect(() =>
      validateFulfillment(
        { fulfillmentMethod: "pickup", schedule: { date: "2020-01-01", timeWindow: "10:00-12:00" } },
        now,
      ),
    ).toThrow(ValidationError);
  });
});

import { describe, expect, it } from "vitest";
import { isValidBahrainMobile, normalizeBahrainMobile } from "@/core/customer/phone";

describe("normalizeBahrainMobile", () => {
  it("accepts a bare 8-digit number starting with 3, 6, or 7", () => {
    expect(normalizeBahrainMobile("36001234")).toBe("+97336001234");
    expect(normalizeBahrainMobile("60012345")).toBe("+97360012345");
    expect(normalizeBahrainMobile("70012345")).toBe("+97370012345");
  });

  it("accepts a +973 or 973 prefix", () => {
    expect(normalizeBahrainMobile("+97336001234")).toBe("+97336001234");
    expect(normalizeBahrainMobile("97336001234")).toBe("+97336001234");
  });

  it("strips spaces and dashes before validating", () => {
    expect(normalizeBahrainMobile("+973 3600 1234")).toBe("+97336001234");
    expect(normalizeBahrainMobile("3600-1234")).toBe("+97336001234");
  });

  it("rejects a number not starting with 3, 6, or 7", () => {
    expect(normalizeBahrainMobile("46001234")).toBeNull();
  });

  it("rejects too few or too many digits", () => {
    expect(normalizeBahrainMobile("3600123")).toBeNull();
    expect(normalizeBahrainMobile("360012345")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(normalizeBahrainMobile("not-a-number")).toBeNull();
  });
});

describe("isValidBahrainMobile", () => {
  it("mirrors normalizeBahrainMobile's success/failure", () => {
    expect(isValidBahrainMobile("36001234")).toBe(true);
    expect(isValidBahrainMobile("12345678")).toBe(false);
  });
});

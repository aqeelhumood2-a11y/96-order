import { describe, expect, it } from "vitest";
import { isValidEmail } from "@/core/customer/email";

describe("isValidEmail", () => {
  it("accepts a well-formed email", () => {
    expect(isValidEmail("shopper@example.com")).toBe(true);
  });

  it.each(["", "not-an-email", "missing-domain@", "@missing-local.com", "spaces are bad@example.com"])("rejects %s", (value) => {
    expect(isValidEmail(value)).toBe(false);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signCartId, verifyCartCookieValue } from "@/lib/cart-cookie";

const ORIGINAL_SECRET = process.env.CART_COOKIE_SECRET;

describe("cart-cookie", () => {
  beforeEach(() => {
    process.env.CART_COOKIE_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CART_COOKIE_SECRET = ORIGINAL_SECRET;
  });

  it("round-trips a cart id through signing and verification", () => {
    const cookieValue = signCartId("cart-123");
    expect(verifyCartCookieValue(cookieValue)).toBe("cart-123");
  });

  it("rejects a tampered cart id (signature no longer matches)", () => {
    const cookieValue = signCartId("cart-123");
    const tampered = cookieValue.replace("cart-123", "cart-456");
    expect(verifyCartCookieValue(tampered)).toBeNull();
  });

  it("rejects a value with no signature separator", () => {
    expect(verifyCartCookieValue("just-some-random-string")).toBeNull();
  });

  it("rejects a value signed with a different secret", () => {
    const cookieValue = signCartId("cart-123");
    process.env.CART_COOKIE_SECRET = "a-different-secret";
    expect(verifyCartCookieValue(cookieValue)).toBeNull();
  });

  it("rejects a non-hex signature without throwing", () => {
    expect(verifyCartCookieValue("cart-123.not-hex-!!")).toBeNull();
  });

  it("throws a readable error when the secret isn't configured", () => {
    delete process.env.CART_COOKIE_SECRET;
    expect(() => signCartId("cart-123")).toThrow(/CART_COOKIE_SECRET/);
  });
});

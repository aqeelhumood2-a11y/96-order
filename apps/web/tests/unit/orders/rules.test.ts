import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import type { PricedCartLine } from "@/core/cart/rules";
import {
  buildOrderLinesFromPricedCart,
  buildOrderNumber,
  isValidOrderNumberFormat,
  isValidOrderStatusTransition,
  ORDER_NUMBER_RANDOM_LENGTH,
} from "@/core/orders/rules";

describe("buildOrderNumber", () => {
  it("formats as ORD-YYMMDD-XXXXXX using UTC date parts", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const orderNumber = buildOrderNumber(now, bytes);
    expect(orderNumber).toMatch(/^ORD-260130-[A-Z0-9]{6}$/);
  });

  it("is deterministic for the same date and bytes", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    const bytes = new Uint8Array([10, 20, 30, 40, 50, 60]);
    expect(buildOrderNumber(now, bytes)).toBe(buildOrderNumber(now, bytes));
  });

  it("produces different numbers for different random bytes", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    const a = buildOrderNumber(now, new Uint8Array([1, 2, 3, 4, 5, 6]));
    const b = buildOrderNumber(now, new Uint8Array([9, 8, 7, 6, 5, 4]));
    expect(a).not.toBe(b);
  });

  it("never emits visually ambiguous characters (0/O/1/I/L)", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    const allBytes = Array.from({ length: 256 }, (_, i) => i);
    const randomPart = buildOrderNumber(now, new Uint8Array(allBytes)).split("-")[2]!;
    expect(randomPart).not.toMatch(/[01OIL]/);
  });

  it("throws if fewer than the required random bytes are supplied", () => {
    expect(() => buildOrderNumber(new Date(), new Uint8Array([1, 2, 3]))).toThrow(RangeError);
  });

  it("random part length matches ORDER_NUMBER_RANDOM_LENGTH", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    const orderNumber = buildOrderNumber(now, new Uint8Array(6).fill(1));
    expect(orderNumber.split("-")[2]).toHaveLength(ORDER_NUMBER_RANDOM_LENGTH);
  });
});

describe("isValidOrderNumberFormat", () => {
  it("accepts a well-formed order number", () => {
    expect(isValidOrderNumberFormat("ORD-260130-7K3PXQ")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidOrderNumberFormat("ord-260130-7k3pxq")).toBe(false);
    expect(isValidOrderNumberFormat("ORD-26013-7K3PXQ")).toBe(false);
    expect(isValidOrderNumberFormat("not-an-order-number")).toBe(false);
    expect(isValidOrderNumberFormat("")).toBe(false);
  });
});

function makePricedLine(overrides: Partial<PricedCartLine> = {}): PricedCartLine {
  return {
    line: { id: "p1:-", productId: "p1", variantId: null, quantity: 2, addedAt: new Date() },
    snapshot: {
      name: "Ethiopia Yirgacheffe",
      slug: "ethiopia-yirgacheffe",
      sku: "ETH-1",
      imageUrl: "https://example.com/a.jpg",
      unitPrice: money(1899),
      isAvailableForSale: true,
      availability: { inStock: true, lowStock: false },
      trackInventory: false,
      allowBackorder: false,
    },
    effectiveQuantity: 2,
    lineTotal: money(3798),
    issues: [],
    ...overrides,
  };
}

describe("buildOrderLinesFromPricedCart", () => {
  it("maps a clean priced line to an order line", () => {
    const lines = buildOrderLinesFromPricedCart([makePricedLine()]);
    expect(lines).toEqual([
      {
        productId: "p1",
        variantId: null,
        productName: "Ethiopia Yirgacheffe",
        variantAttributes: undefined,
        sku: "ETH-1",
        imageUrl: "https://example.com/a.jpg",
        unitPrice: money(1899),
        quantity: 2,
        lineTotal: money(3798),
      },
    ]);
  });

  it("excludes a line with no snapshot (product no longer resolves)", () => {
    const lines = buildOrderLinesFromPricedCart([makePricedLine({ snapshot: undefined, effectiveQuantity: 0 })]);
    expect(lines).toEqual([]);
  });

  it("excludes a line whose effective quantity is zero (blocked out of stock)", () => {
    const lines = buildOrderLinesFromPricedCart([makePricedLine({ effectiveQuantity: 0, issues: ["out_of_stock"] })]);
    expect(lines).toEqual([]);
  });
});

describe("isValidOrderStatusTransition", () => {
  it("allows pending_payment -> confirmed and -> cancelled", () => {
    expect(isValidOrderStatusTransition("pending_payment", "confirmed")).toBe(true);
    expect(isValidOrderStatusTransition("pending_payment", "cancelled")).toBe(true);
  });

  it("allows confirmed -> cancelled", () => {
    expect(isValidOrderStatusTransition("confirmed", "cancelled")).toBe(true);
  });

  it("rejects a transition not in the Phase 5 allow-list", () => {
    expect(isValidOrderStatusTransition("confirmed", "preparing")).toBe(false);
    expect(isValidOrderStatusTransition("cancelled", "confirmed")).toBe(false);
    expect(isValidOrderStatusTransition("completed", "pending_payment")).toBe(false);
  });
});

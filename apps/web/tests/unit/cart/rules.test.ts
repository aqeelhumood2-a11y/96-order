import { describe, expect, it } from "vitest";
import { money, ZERO_BHD } from "@/core/money/money";
import {
  addCartLine,
  cartLineKey,
  clampQuantity,
  findCartLine,
  MAX_CART_LINE_QUANTITY,
  priceCart,
  removeCartLine,
  updateCartLineQuantity,
  type CartLineCatalogSnapshot,
} from "@/core/cart/rules";
import type { Cart, CartLine } from "@/core/cart/entities";

const NOW = new Date("2026-01-01T00:00:00Z");

function makeCart(lines: CartLine[]): Cart {
  return { id: "cart-1", customerId: null, lines, createdAt: NOW, updatedAt: NOW, expiresAt: NOW, couponCode: null };
}

function makeSnapshot(overrides: Partial<CartLineCatalogSnapshot> = {}): CartLineCatalogSnapshot {
  return {
    name: "Ethiopia Yirgacheffe",
    slug: "ethiopia-yirgacheffe",
    sku: "ETH-1",
    imageUrl: null,
    unitPrice: money(1899),
    isAvailableForSale: true,
    availability: { inStock: true, lowStock: false },
    allowBackorder: false,
    trackInventory: false,
    categoryIds: [],
    brandId: null,
    ...overrides,
  };
}

describe("cartLineKey", () => {
  it("combines product and variant ids", () => {
    expect(cartLineKey("p1", "v1")).toBe("p1:v1");
  });

  it("uses a placeholder for a null variant", () => {
    expect(cartLineKey("p1", null)).toBe("p1:-");
  });
});

describe("clampQuantity", () => {
  it("floors below the minimum", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
  });

  it("caps at the maximum", () => {
    expect(clampQuantity(1000)).toBe(MAX_CART_LINE_QUANTITY);
  });

  it("truncates a fractional quantity", () => {
    expect(clampQuantity(3.7)).toBe(3);
  });
});

describe("addCartLine", () => {
  it("appends a new line for a product+variant not already in the cart", () => {
    const lines = addCartLine([], { productId: "p1", variantId: null, quantity: 2 }, NOW);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ productId: "p1", variantId: null, quantity: 2 });
  });

  it("merges into the existing line for the same product+variant", () => {
    const first = addCartLine([], { productId: "p1", variantId: "v1", quantity: 2 }, NOW);
    const second = addCartLine(first, { productId: "p1", variantId: "v1", quantity: 3 }, NOW);
    expect(second).toHaveLength(1);
    expect(second[0]!.quantity).toBe(5);
  });

  it("treats a different variant of the same product as a distinct line", () => {
    const first = addCartLine([], { productId: "p1", variantId: "v1", quantity: 1 }, NOW);
    const second = addCartLine(first, { productId: "p1", variantId: "v2", quantity: 1 }, NOW);
    expect(second).toHaveLength(2);
  });

  it("clamps a merged quantity at the maximum", () => {
    const first = addCartLine([], { productId: "p1", variantId: null, quantity: 90 }, NOW);
    const second = addCartLine(first, { productId: "p1", variantId: null, quantity: 90 }, NOW);
    expect(second[0]!.quantity).toBe(MAX_CART_LINE_QUANTITY);
  });
});

describe("updateCartLineQuantity / removeCartLine", () => {
  it("updates only the matching line", () => {
    const lines = [
      { id: "a", productId: "p1", variantId: null, quantity: 1, addedAt: NOW },
      { id: "b", productId: "p2", variantId: null, quantity: 1, addedAt: NOW },
    ];
    const updated = updateCartLineQuantity(lines, "a", 5);
    expect(updated.find((l) => l.id === "a")?.quantity).toBe(5);
    expect(updated.find((l) => l.id === "b")?.quantity).toBe(1);
  });

  it("removes only the matching line", () => {
    const lines = [
      { id: "a", productId: "p1", variantId: null, quantity: 1, addedAt: NOW },
      { id: "b", productId: "p2", variantId: null, quantity: 1, addedAt: NOW },
    ];
    expect(removeCartLine(lines, "a").map((l) => l.id)).toEqual(["b"]);
  });
});

describe("findCartLine", () => {
  it("finds a line by product+variant", () => {
    const lines = [{ id: "p1:-", productId: "p1", variantId: null, quantity: 1, addedAt: NOW }];
    expect(findCartLine(lines, "p1", null)).toBeDefined();
    expect(findCartLine(lines, "p1", "v1")).toBeUndefined();
  });
});

describe("priceCart", () => {
  it("prices a simple cart and computes subtotal/shipping/grand total", () => {
    const cart = makeCart([{ id: "p1:-", productId: "p1", variantId: null, quantity: 2, addedAt: NOW }]);
    const snapshots = new Map([["p1:-", makeSnapshot({ unitPrice: money(1000) })]]);
    const priced = priceCart(cart, snapshots);

    expect(priced.subtotal).toEqual(money(2000));
    expect(priced.shippingFee).toEqual(money(2000)); // below the reduced threshold
    expect(priced.grandTotal).toEqual(money(4000));
    expect(priced.hasBlockingIssues).toBe(false);
  });

  it("treats a missing snapshot as product_unavailable and excludes it from the subtotal", () => {
    const cart = makeCart([{ id: "gone:-", productId: "gone", variantId: null, quantity: 1, addedAt: NOW }]);
    const priced = priceCart(cart, new Map());

    expect(priced.lines[0]!.issues).toEqual(["product_unavailable"]);
    expect(priced.lines[0]!.lineTotal).toEqual(ZERO_BHD);
    expect(priced.subtotal).toEqual(ZERO_BHD);
    expect(priced.hasBlockingIssues).toBe(true);
  });

  it("zeroes an out-of-stock line that doesn't allow backorder", () => {
    const cart = makeCart([{ id: "p1:-", productId: "p1", variantId: null, quantity: 3, addedAt: NOW }]);
    const snapshots = new Map([["p1:-", makeSnapshot({ availability: { inStock: false, lowStock: false } })]]);
    const priced = priceCart(cart, snapshots);

    expect(priced.lines[0]!.effectiveQuantity).toBe(0);
    expect(priced.lines[0]!.issues).toEqual(["out_of_stock"]);
    expect(priced.hasBlockingIssues).toBe(true);
  });

  it("keeps an out-of-stock line priced when backorder is allowed", () => {
    const cart = makeCart([{ id: "p1:-", productId: "p1", variantId: null, quantity: 3, addedAt: NOW }]);
    const snapshots = new Map([
      ["p1:-", makeSnapshot({ availability: { inStock: false, lowStock: false }, allowBackorder: true, unitPrice: money(1000) })],
    ]);
    const priced = priceCart(cart, snapshots);

    expect(priced.lines[0]!.effectiveQuantity).toBe(3);
    expect(priced.lines[0]!.issues).toEqual([]);
    expect(priced.subtotal).toEqual(money(3000));
  });

  it("clamps the effective quantity down to the tracked maximum and flags quantity_reduced", () => {
    const cart = makeCart([{ id: "p1:-", productId: "p1", variantId: null, quantity: 10, addedAt: NOW }]);
    const snapshots = new Map([["p1:-", makeSnapshot({ maxQuantity: 4, unitPrice: money(1000) })]]);
    const priced = priceCart(cart, snapshots);

    expect(priced.lines[0]!.effectiveQuantity).toBe(4);
    expect(priced.lines[0]!.issues).toEqual(["quantity_reduced"]);
    expect(priced.subtotal).toEqual(money(4000));
    // Not a blocking issue — the shopper can still check out with the reduced quantity.
    expect(priced.hasBlockingIssues).toBe(false);
  });

  it("never charges shipping on an empty cart", () => {
    const priced = priceCart(makeCart([]), new Map());
    expect(priced.shippingFee.amount).toBe(0);
    expect(priced.subtotal.amount).toBe(0);
  });
});

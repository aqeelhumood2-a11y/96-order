import { describe, expect, it } from "vitest";
import type { Cart } from "@/core/cart/entities";
import { addToCart } from "@/services/cart/add-to-cart";
import { updateCartLine } from "@/services/cart/update-cart-line";
import { removeCartLine } from "@/services/cart/remove-cart-line";
import { clearCart } from "@/services/cart/clear-cart";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { createMockCartDeps, makeProduct } from "./test-helpers";

function withPersistentStore(deps: ReturnType<typeof createMockCartDeps>) {
  let storedCart: Cart | null = null;
  deps.carts.findById = async () => storedCart;
  deps.carts.upsert = async (cart) => {
    storedCart = cart;
  };
  return deps;
}

describe("updateCartLine", () => {
  it("updates the quantity of the matching line only", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });

    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps);
    const priced = await updateCartLine({ cartId: "cart-1", lineId: "product-1:-", quantity: 5 }, deps);

    expect(priced.lines[0]!.line.quantity).toBe(5);
    expect(priced.subtotal.amount).toBe(5000);
  });

  it("clamps the quantity into the valid range", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });

    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps);
    const priced = await updateCartLine({ cartId: "cart-1", lineId: "product-1:-", quantity: 0 }, deps);

    expect(priced.lines[0]!.line.quantity).toBe(1); // clamped to the minimum, not removed
  });

  it("is a no-op on an empty/nonexistent cart (no matching line to update)", async () => {
    const deps = createMockCartDeps();
    const priced = await updateCartLine({ cartId: "cart-1", lineId: "does-not-exist", quantity: 5 }, deps);
    expect(priced.lines).toHaveLength(0);
  });
});

describe("removeCartLine", () => {
  it("removes only the matching line", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });

    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps);
    await addToCart({ cartId: "cart-1", productId: "product-2", variantId: null, quantity: 1 }, deps);

    const priced = await removeCartLine({ cartId: "cart-1", lineId: "product-1:-" }, deps);

    expect(priced.lines).toHaveLength(1);
    expect(priced.lines[0]!.line.productId).toBe("product-2");
  });
});

describe("clearCart", () => {
  it("empties every line", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });

    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 2 }, deps);
    const priced = await clearCart("cart-1", deps);

    expect(priced.lines).toHaveLength(0);
    expect(priced.subtotal.amount).toBe(0);
  });
});

describe("getPricedCart", () => {
  it("returns an empty priced cart without writing to Firestore for a cart that doesn't exist yet", async () => {
    const deps = createMockCartDeps();
    const { cart, priced } = await getPricedCart("brand-new-cart", deps);

    expect(cart.lines).toHaveLength(0);
    expect(priced.lines).toHaveLength(0);
    expect(deps.carts.upsert).not.toHaveBeenCalled();
  });

  it("revalidates against live catalog data — a product removed after being added shows as unavailable", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });
    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps);

    // The product is now archived — a real Firestore state change between adding and re-reading the cart.
    deps.products.findById = async () => null;

    const { priced } = await getPricedCart("cart-1", deps);
    expect(priced.lines[0]!.issues).toEqual(["product_unavailable"]);
    expect(priced.hasBlockingIssues).toBe(true);
  });

  it("reflects a price change made after the item was added to the cart", async () => {
    const deps = withPersistentStore(createMockCartDeps());
    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1000 });
    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps);

    deps.products.findById = async (id) => makeProduct({ id, basePrice: 1500 });

    const { priced } = await getPricedCart("cart-1", deps);
    expect(priced.subtotal.amount).toBe(1500);
  });
});

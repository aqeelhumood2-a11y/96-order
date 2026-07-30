import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import { addToCart } from "@/services/cart/add-to-cart";
import { createMockCartDeps, makeProduct } from "./test-helpers";

describe("addToCart", () => {
  it("rejects a quantity below 1", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct();
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 0 }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects a quantity above the per-line maximum", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct();
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1000 }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects a product that doesn't exist", async () => {
    const deps = createMockCartDeps();
    await expect(addToCart({ cartId: "cart-1", productId: "missing", variantId: null, quantity: 1 }, deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects a draft/hidden product the same way as a missing one", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ status: "draft", visibility: "hidden" });
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps)).rejects.toThrow(NotFoundError);
  });

  it("requires a variant when the product has variants", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () =>
      makeProduct({
        hasVariants: true,
        variants: [{ id: "v1", sku: "V1", attributeSelections: { size: "250g" }, status: "active", trackInventory: false, allowBackorder: false }],
      });
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects an unknown or inactive variant id", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () =>
      makeProduct({
        hasVariants: true,
        variants: [{ id: "v1", sku: "V1", attributeSelections: {}, status: "archived", trackInventory: false, allowBackorder: false }],
      });
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: "v1", quantity: 1 }, deps)).rejects.toThrow(ValidationError);
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: "does-not-exist", quantity: 1 }, deps)).rejects.toThrow(
      ValidationError,
    );
  });

  it("rejects a variantId for a product that has no variants", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ hasVariants: false });
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: "v1", quantity: 1 }, deps)).rejects.toThrow(ValidationError);
  });

  it("blocks adding an out-of-stock item when backorder isn't allowed", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ trackInventory: true, allowBackorder: false });
    deps.inventory.findByProductAndVariant = async () => ({
      id: "inv-1",
      productId: "product-1",
      variantId: null,
      onHand: 0,
      reserved: 0,
      updatedAt: new Date(),
      updatedBy: "test",
    });
    await expect(addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 1 }, deps)).rejects.toThrow(ConflictError);
  });

  it("allows adding an out-of-stock item when backorder is allowed", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ trackInventory: true, allowBackorder: true });
    deps.inventory.findByProductAndVariant = async () => ({
      id: "inv-1",
      productId: "product-1",
      variantId: null,
      onHand: 0,
      reserved: 0,
      updatedAt: new Date(),
      updatedBy: "test",
    });

    const priced = await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 2 }, deps);
    expect(priced.hasBlockingIssues).toBe(false);
    expect(priced.lines[0]!.effectiveQuantity).toBe(2);
  });

  it("persists the cart and returns a priced cart reflecting the new line", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ basePrice: 1000 });

    const priced = await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 3 }, deps);

    expect(deps.carts.upsert).toHaveBeenCalledTimes(1);
    expect(priced.lines).toHaveLength(1);
    expect(priced.subtotal.amount).toBe(3000);
  });

  it("merges into an existing line for the same product on a second call", async () => {
    const deps = createMockCartDeps();
    deps.products.findById = async () => makeProduct({ basePrice: 1000 });

    let storedCart: Awaited<ReturnType<typeof deps.carts.findById>> = null;
    deps.carts.findById = async () => storedCart;
    deps.carts.upsert = async (cart) => {
      storedCart = cart;
    };

    await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 2 }, deps);
    const priced = await addToCart({ cartId: "cart-1", productId: "product-1", variantId: null, quantity: 3 }, deps);

    expect(priced.lines).toHaveLength(1);
    expect(priced.lines[0]!.line.quantity).toBe(5);
  });
});

import { computeAvailability, isPubliclyVisible } from "@/core/storefront/rules";
import { addCartLine, MAX_CART_LINE_QUANTITY, MIN_CART_LINE_QUANTITY } from "@/core/cart/rules";
import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";
import { priceCart, type PricedCart } from "@/core/cart/rules";
import { buildCatalogSnapshots } from "./catalog-snapshot";
import { getCartOrEmpty, saveCart } from "./cart-store";
import { defaultCartDeps, type CartDeps } from "./dependencies";

export interface AddToCartInput {
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
}

/**
 * Validates the requested line *before* ever touching the stored cart —
 * a variant is required when the product has any, the selected variant
 * (or the base product) must actually be publicly orderable, and an
 * out-of-stock item is rejected unless backorder is allowed. None of this
 * trusts anything about the product's name/price/availability from the
 * request itself — only `productId`/`variantId`/`quantity` are ever read
 * from `input`.
 */
export async function addToCart(input: AddToCartInput, deps: CartDeps = defaultCartDeps): Promise<PricedCart> {
  if (!Number.isFinite(input.quantity) || input.quantity < MIN_CART_LINE_QUANTITY) {
    throw new ValidationError("Quantity must be at least 1.");
  }
  if (input.quantity > MAX_CART_LINE_QUANTITY) {
    throw new ValidationError(`Quantity cannot exceed ${MAX_CART_LINE_QUANTITY} per item.`);
  }

  const product = await deps.products.findById(input.productId);
  if (!product || !isPubliclyVisible(product)) {
    throw new NotFoundError("This product is no longer available.");
  }

  if (product.hasVariants) {
    if (!input.variantId) {
      throw new ValidationError("Please select an option before adding this product to your cart.");
    }
    const variant = product.variants.find((candidate) => candidate.id === input.variantId);
    if (!variant || variant.status !== "active") {
      throw new ValidationError("The selected option is no longer available.");
    }
  } else if (input.variantId) {
    throw new ValidationError("This product doesn't have selectable options.");
  }

  const variant = input.variantId ? product.variants.find((candidate) => candidate.id === input.variantId) : undefined;
  const trackInventory = variant ? variant.trackInventory : product.trackInventory;
  const allowBackorder = variant ? variant.allowBackorder : product.allowBackorder;
  const record = await deps.inventory.findByProductAndVariant(input.productId, input.variantId);
  const availability = computeAvailability(record, allowBackorder, trackInventory);
  if (!availability.inStock) {
    throw new ConflictError("This item is currently out of stock.");
  }

  const cart = await getCartOrEmpty(input.cartId, deps);
  const nextLines = addCartLine(cart.lines, { productId: input.productId, variantId: input.variantId, quantity: input.quantity }, new Date());
  const savedCart = await saveCart({ ...cart, lines: nextLines }, deps);

  const snapshots = await buildCatalogSnapshots(savedCart.lines, deps);
  return priceCart(savedCart, snapshots);
}

import { add, multiply, sum, ZERO_BHD, type Money } from "@/core/money/money";
import { computeFreeShippingUpsell, computeShippingFee, type FreeShippingUpsell } from "@/core/shipping/rules";
import type { Cart, CartLine } from "./entities";

export const MAX_CART_LINE_QUANTITY = 99;
export const MIN_CART_LINE_QUANTITY = 1;

/** `${productId}:${variantId ?? "-"}` — the same "product+variant identity" convention `infrastructure/firebase/repositories/firestore-public-inventory-availability.ts` already uses for inventory record ids, reused here so a cart line and its inventory record are trivially correlatable. */
export function cartLineKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? "-"}`;
}

export function findCartLine(lines: readonly CartLine[], productId: string, variantId: string | null): CartLine | undefined {
  return lines.find((line) => line.productId === productId && line.variantId === variantId);
}

export function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.trunc(quantity), MIN_CART_LINE_QUANTITY), MAX_CART_LINE_QUANTITY);
}

/** Merges into an existing line for the same product+variant rather than appending a duplicate. */
export function addCartLine(lines: readonly CartLine[], input: { productId: string; variantId: string | null; quantity: number }, now: Date): CartLine[] {
  const existing = findCartLine(lines, input.productId, input.variantId);
  if (!existing) {
    const newLine: CartLine = {
      id: cartLineKey(input.productId, input.variantId),
      productId: input.productId,
      variantId: input.variantId,
      quantity: clampQuantity(input.quantity),
      addedAt: now,
    };
    return [...lines, newLine];
  }
  return lines.map((line) => (line.id === existing.id ? { ...line, quantity: clampQuantity(line.quantity + input.quantity) } : line));
}

export function updateCartLineQuantity(lines: readonly CartLine[], lineId: string, quantity: number): CartLine[] {
  return lines.map((line) => (line.id === lineId ? { ...line, quantity: clampQuantity(quantity) } : line));
}

export function removeCartLine(lines: readonly CartLine[], lineId: string): CartLine[] {
  return lines.filter((line) => line.id !== lineId);
}

/**
 * Everything a cart line needs re-derived from *live* catalog/inventory
 * data at price/validate time — built by the service layer (which has
 * Firestore access), consumed here as a pure input. Absence of a snapshot
 * for a line (handled by `priceCartLine` treating `undefined` specially)
 * means the product/variant no longer resolves at all — deleted, or the
 * id was never real.
 */
export interface CartLineCatalogSnapshot {
  name: string;
  slug: string;
  sku: string;
  variantAttributes?: Record<string, string>;
  imageUrl: string | null;
  unitPrice: Money;
  /** Active product/visible, and (if a variant) the variant itself still exists and is active — collapsed to one flag since a cart line has nothing useful to do with a finer distinction. */
  isAvailableForSale: boolean;
  availability: { inStock: boolean; lowStock: boolean };
  allowBackorder: boolean;
  /** Whether this product/variant tracks inventory at all — an untracked line has unlimited stock and, at checkout, is never passed to the reservation service (see `services/checkout/create-order.ts`), since there is no `onHand` count for it to reserve against. */
  trackInventory: boolean;
  /** Present only when inventory is tracked and backorder isn't allowed — an unbounded (untracked or backorderable) line has no cap. */
  maxQuantity?: number;
  /**
   * Phase 7: the product's category/brand identity, purely so
   * `core/pricing/discount-engine.ts` can evaluate a coupon/promotion's
   * category/brand scope against this line — `priceCart` itself never
   * reads these two fields, so their addition doesn't change anything
   * about how a line is priced, only what data is available to the
   * discount layer built on top of it.
   */
  categoryIds: string[];
  brandId: string | null;
}

export const CART_LINE_ISSUES = ["product_unavailable", "out_of_stock", "quantity_reduced"] as const;
export type CartLineIssue = (typeof CART_LINE_ISSUES)[number];

export interface PricedCartLine {
  line: CartLine;
  snapshot: CartLineCatalogSnapshot | undefined;
  /** The quantity actually priced — clamped down from `line.quantity` when stock can't cover it; `0` when the line is entirely blocked. */
  effectiveQuantity: number;
  lineTotal: Money;
  issues: CartLineIssue[];
}

export interface PricedCart {
  cartId: string;
  lines: PricedCartLine[];
  subtotal: Money;
  shippingFee: Money;
  freeShippingUpsell: FreeShippingUpsell;
  /** Always zero in Phase 5 — see README's Discount seam. */
  discountTotal: Money;
  grandTotal: Money;
  /** True if any line needs shopper action (removed, restored to a lower quantity, or gone entirely) before checkout can proceed. */
  hasBlockingIssues: boolean;
}

function priceCartLine(line: CartLine, snapshot: CartLineCatalogSnapshot | undefined): PricedCartLine {
  if (!snapshot || !snapshot.isAvailableForSale) {
    return { line, snapshot, effectiveQuantity: 0, lineTotal: ZERO_BHD, issues: ["product_unavailable"] };
  }

  const issues: CartLineIssue[] = [];
  let effectiveQuantity = line.quantity;

  if (!snapshot.availability.inStock && !snapshot.allowBackorder) {
    issues.push("out_of_stock");
    effectiveQuantity = 0;
  } else if (snapshot.maxQuantity !== undefined && line.quantity > snapshot.maxQuantity) {
    issues.push("quantity_reduced");
    effectiveQuantity = snapshot.maxQuantity;
  }

  return { line, snapshot, effectiveQuantity, lineTotal: multiply(snapshot.unitPrice, effectiveQuantity), issues };
}

/**
 * The one place cart totals are computed — called identically by the cart
 * page/drawer (display only) and by checkout (where `hasBlockingIssues`
 * gates whether the shopper can proceed at all). `catalogSnapshots` is
 * keyed by `cartLineKey(productId, variantId)`.
 */
export function priceCart(cart: Cart, catalogSnapshots: ReadonlyMap<string, CartLineCatalogSnapshot>): PricedCart {
  const lines = cart.lines.map((line) => priceCartLine(line, catalogSnapshots.get(cartLineKey(line.productId, line.variantId))));
  const subtotal = sum(lines.map((line) => line.lineTotal));
  const shippingFee = lines.length === 0 ? ZERO_BHD : computeShippingFee(subtotal);
  const freeShippingUpsell = computeFreeShippingUpsell(subtotal);
  const discountTotal = ZERO_BHD;
  const grandTotal = add(subtotal, shippingFee);
  const hasBlockingIssues = lines.some((line) => line.issues.includes("product_unavailable") || line.issues.includes("out_of_stock"));

  return { cartId: cart.id, lines, subtotal, shippingFee, freeShippingUpsell, discountTotal, grandTotal, hasBlockingIssues };
}

import type { PricedCartLine } from "@/core/cart/rules";
import type { OrderLine, OrderStatus } from "./entities";

/** Excludes visually-similar characters (`0`/`O`, `1`/`I`/`L`) so a spoken or handwritten order number is never ambiguous. */
const ORDER_NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const ORDER_NUMBER_RANDOM_LENGTH = 6;

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Builds a public order number from a date and a source of randomness the
 * caller supplies — entropy generation (`crypto.randomBytes`) is a side
 * effect that belongs at the service/infrastructure edge, not inside core,
 * so this stays a deterministic, unit-testable pure function. Format:
 * `ORD-YYMMDD-XXXXXX`, e.g. `ORD-260130-7K3PXQ` — the date groups orders
 * for human scanning without exposing a running sequence number (the
 * random suffix is what actually makes each one unique and non-guessable;
 * see `services/orders/generate-order-number.ts` for the uniqueness-under-
 * concurrency reservation that pairs with this).
 */
export function buildOrderNumber(now: Date, randomBytes: Uint8Array): string {
  if (randomBytes.length < ORDER_NUMBER_RANDOM_LENGTH) {
    throw new RangeError(`buildOrderNumber needs at least ${ORDER_NUMBER_RANDOM_LENGTH} random bytes, got ${randomBytes.length}`);
  }
  const randomPart = Array.from(randomBytes.slice(0, ORDER_NUMBER_RANDOM_LENGTH))
    .map((byte) => ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length])
    .join("");
  const datePart = `${now.getUTCFullYear() % 100}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`;
  return `ORD-${datePart}-${randomPart}`;
}

const ORDER_NUMBER_PATTERN = /^ORD-\d{6}-[A-Z0-9]{6}$/;

export function isValidOrderNumberFormat(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}

/**
 * Converts a priced, checkout-ready cart into the permanent `OrderLine`
 * snapshots — only lines with a resolved snapshot and a positive
 * effective quantity are included. The checkout use case must have
 * already rejected a cart with `hasBlockingIssues`, so by the time this
 * runs every remaining line is expected to be clean; this filter is a
 * second, defensive guarantee that a blocked or unresolvable line can
 * never silently end up on a paid order.
 */
export function buildOrderLinesFromPricedCart(pricedLines: readonly PricedCartLine[]): OrderLine[] {
  return pricedLines
    .filter((line): line is PricedCartLine & { snapshot: NonNullable<PricedCartLine["snapshot"]> } => line.effectiveQuantity > 0 && line.snapshot !== undefined)
    .map((line) => ({
      productId: line.line.productId,
      variantId: line.line.variantId,
      productName: line.snapshot.name,
      variantAttributes: line.snapshot.variantAttributes,
      sku: line.snapshot.sku,
      imageUrl: line.snapshot.imageUrl,
      unitPrice: line.snapshot.unitPrice,
      quantity: line.effectiveQuantity,
      lineTotal: line.lineTotal,
    }));
}

/**
 * The only status transitions Phase 5's own code ever performs
 * (`pending_payment -> confirmed`, either -> `cancelled`). Every other
 * entry in `ORDER_STATUSES` is reachable only through a future admin
 * order-management workflow this map deliberately doesn't define yet —
 * adding those transitions is additive, not a change to what's already
 * approved here.
 */
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

import type { PricedCartLine } from "@/core/cart/rules";
import type { FulfillmentMethod } from "@/core/delivery/entities";
import type { OrderCustomerSnapshot, OrderLine, OrderStatus } from "./entities";

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
 * The complete Phase 6 admin order-management workflow. `pending_payment
 * -> confirmed` and either -> `cancelled` are the two transitions Phase
 * 5's own checkout/webhook/cash-confirmation code performs; every other
 * edge here is new in Phase 6, driven exclusively by an authorized staff
 * member acting through `services/orders/change-order-status.ts`.
 *
 * `ready -> completed` exists directly (skipping `out_for_delivery`)
 * because a pickup order is "completed" the moment the customer collects
 * it from `ready` — `out_for_delivery` only ever applies to a delivery
 * fulfillment. `completed` and `cancelled` are terminal: neither has an
 * entry in this map, so every transition out of either is rejected.
 */
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
};

export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

/** Neither status has any outgoing transition in `ALLOWED_TRANSITIONS` — an order in this state cannot be moved further. */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/**
 * The set of statuses a given order can legally move to right now, scoped
 * by its fulfillment method — `out_for_delivery` is filtered out for a
 * pickup order (there is no courier leg to track) even though the raw
 * transition map allows it from `ready`, so the admin UI never offers an
 * action that would be semantically wrong for how this order ships.
 */
export function allowedNextStatuses(from: OrderStatus, fulfillmentMethod: FulfillmentMethod): OrderStatus[] {
  const candidates = ALLOWED_TRANSITIONS[from] ?? [];
  if (fulfillmentMethod === "pickup") {
    return candidates.filter((status) => status !== "out_for_delivery");
  }
  return [...candidates];
}

const SEARCH_WORD_MIN_LENGTH = 2;
const TOKEN_PREFIX_MIN_LENGTH = 2;
const COMBINING_MARKS = /\p{M}/gu;

function wordsOf(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= SEARCH_WORD_MIN_LENGTH);
}

function prefixesOf(word: string): string[] {
  const prefixes: string[] = [];
  for (let length = TOKEN_PREFIX_MIN_LENGTH; length <= word.length; length++) {
    prefixes.push(word.slice(0, length));
  }
  return prefixes;
}

/** All prefixes of the whole (whitespace-trimmed, lowercased, otherwise unmodified — hyphens/`@`/`+` kept) string, from length `TOKEN_PREFIX_MIN_LENGTH` up to its full length. Unlike `prefixesOf`/`wordsOf` above, this never splits on punctuation — an order number (`ORD-260803-7K3PXQ`), email, or phone number needs its separators preserved so a staff member typing `ord-2608` or `john@ex` still gets an `array-contains` hit on a stored prefix. */
function rawPrefixesOf(value: string): string[] {
  const normalized = value.trim().toLowerCase();
  const prefixes: string[] = [];
  for (let length = TOKEN_PREFIX_MIN_LENGTH; length <= normalized.length; length++) {
    prefixes.push(normalized.slice(0, length));
  }
  return prefixes;
}

const MAX_ORDER_SEARCH_TOKENS = 200;

/**
 * Builds the denormalized `searchTokens` array stored on an `Order`
 * document — the same prefix-token strategy
 * `core/catalog/rules.ts#buildSearchTokens` uses for product search (see
 * README's Order search strategy section), applied to the fields an admin
 * actually searches orders by (README's Search & Filters requirements):
 * order number, customer name, email, and phone. Name/company get
 * word-split prefixes (`addWordsAndPrefixes`, punctuation-insensitive —
 * "de Silva" is findable by either word); order number/email/mobile get
 * *whole-string* prefixes (`rawPrefixesOf`, punctuation-preserving) instead,
 * since those are looked up as one contiguous code a staff member types or
 * pastes progressively, not as separate words. Mobile is indexed twice —
 * once in its stored `+973XXXXXXXX` form and once with the `+973` prefix
 * stripped — so a search for the local 8-digit number alone still matches.
 */
export function buildOrderSearchTokens(orderNumber: string, customer: OrderCustomerSnapshot): string[] {
  const tokens = new Set<string>();

  const addWordsAndPrefixes = (value: string | undefined) => {
    if (!value) return;
    for (const word of wordsOf(value)) {
      for (const prefix of prefixesOf(word)) {
        tokens.add(prefix);
      }
    }
  };
  addWordsAndPrefixes(customer.fullName);
  addWordsAndPrefixes(customer.companyName);

  const addRawPrefixes = (value: string | undefined) => {
    if (!value) return;
    for (const prefix of rawPrefixesOf(value)) {
      tokens.add(prefix);
    }
  };
  addRawPrefixes(orderNumber);
  addRawPrefixes(customer.email);
  addRawPrefixes(customer.mobile);
  if (customer.mobile.startsWith("+973")) {
    addRawPrefixes(customer.mobile.slice(4));
  }

  return Array.from(tokens).slice(0, MAX_ORDER_SEARCH_TOKENS);
}

/**
 * Splits a raw admin search-box query into whitespace-separated words
 * (lowercased, punctuation preserved — unlike `wordsOf`, so a pasted
 * order number or email stays one intact token) for
 * `services/orders/list-orders.ts`'s primary-token-plus-in-memory-refine
 * strategy — the exact same two-step approach
 * `services/storefront/search-products.ts` already uses for product
 * search: the *longest* word becomes the one Firestore `array-contains`
 * filter, and any remaining words are checked in-memory against the
 * bounded page that query already returned.
 */
export function tokenizeOrderSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= TOKEN_PREFIX_MIN_LENGTH);
}

/**
 * True if every query word appears as a substring somewhere in the
 * order's own searchable text — mirrors
 * `core/catalog/rules.ts#matchesAllQueryWords` for orders. Applied only to
 * the bounded page `list-orders.ts`'s primary-token query already fetched,
 * never a second Firestore call.
 */
export function orderMatchesAllQueryWords(order: { orderNumber: string; customer: OrderCustomerSnapshot }, queryWords: readonly string[]): boolean {
  const haystack = [order.orderNumber, order.customer.fullName, order.customer.email, order.customer.mobile, order.customer.companyName ?? ""]
    .join(" ")
    .toLowerCase();
  return queryWords.every((word) => haystack.includes(word));
}

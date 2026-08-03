import { ACTIVE_CURRENCY, add, subtract, type Money, ZERO_BHD } from "@/core/money/money";
import type { OrderCustomerSnapshot } from "@/core/orders/entities";
import type { Customer } from "./entities";

/** The `Customer.id` for a given order's contact email — normalized the exact same way `services/checkout/validation.ts#validateCustomer` already normalizes it, so this is idempotent to compute from either the raw checkout input or an already-stored `Order.customer.email`. */
export function customerKeyFromEmail(email: string): string {
  return email.trim().toLowerCase();
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

/** Punctuation-preserving whole-string prefixes — see `core/orders/rules.ts#rawPrefixesOf`'s doc comment for why email/mobile need this instead of word-split prefixes. */
function rawPrefixesOf(value: string): string[] {
  const normalized = value.trim().toLowerCase();
  const prefixes: string[] = [];
  for (let length = TOKEN_PREFIX_MIN_LENGTH; length <= normalized.length; length++) {
    prefixes.push(normalized.slice(0, length));
  }
  return prefixes;
}

/** Same prefix-token search strategy as `core/orders/rules.ts#buildOrderSearchTokens` and `core/catalog/rules.ts#buildSearchTokens` — see either's doc comment for the rationale. */
export function buildCustomerSearchTokens(customer: Pick<Customer, "fullName" | "email" | "mobile" | "companyName">): string[] {
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
  addRawPrefixes(customer.email);
  addRawPrefixes(customer.mobile);
  if (customer.mobile.startsWith("+973")) {
    addRawPrefixes(customer.mobile.slice(4));
  }

  return Array.from(tokens);
}

/** Same query tokenization as `core/orders/rules.ts#tokenizeOrderSearchQuery` — see its doc comment. */
export function tokenizeCustomerSearchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= TOKEN_PREFIX_MIN_LENGTH);
}

/** Mirrors `core/orders/rules.ts#orderMatchesAllQueryWords` for the customer in-memory refinement step. */
export function customerMatchesAllQueryWords(customer: Pick<Customer, "fullName" | "email" | "mobile" | "companyName">, queryWords: readonly string[]): boolean {
  const haystack = [customer.fullName, customer.email, customer.mobile, customer.companyName ?? ""].join(" ").toLowerCase();
  return queryWords.every((word) => haystack.includes(word));
}

/**
 * Folds a newly created order's contact snapshot into the customer
 * aggregate — pure so it's unit-testable without Firestore. `existing:
 * null` builds a brand-new `Customer`; otherwise this always increments
 * `totalOrders`/`totalSpent` and refreshes contact fields to the new
 * order's snapshot (the "latest order wins" convention, matching how
 * `Order.customer` itself is just a point-in-time copy). The caller
 * (`services/customers/upsert-customer-from-order.ts`) is responsible for
 * the actual transactional read-modify-write against Firestore — this
 * function only computes what the next state should be.
 */
export function nextCustomerOnOrderCreated(
  existing: Customer | null,
  input: { customer: OrderCustomerSnapshot; grandTotal: Money; orderCreatedAt: Date },
): Customer {
  const id = customerKeyFromEmail(input.customer.email);
  const base: Customer = existing ?? {
    id,
    kind: "guest",
    fullName: input.customer.fullName,
    email: id,
    mobile: input.customer.mobile,
    companyName: input.customer.companyName,
    totalOrders: 0,
    totalSpent: ZERO_BHD,
    firstOrderAt: input.orderCreatedAt,
    lastOrderAt: input.orderCreatedAt,
    searchTokens: [],
    createdAt: input.orderCreatedAt,
    updatedAt: input.orderCreatedAt,
  };

  const next: Customer = {
    ...base,
    fullName: input.customer.fullName,
    mobile: input.customer.mobile,
    companyName: input.customer.companyName,
    totalOrders: base.totalOrders + 1,
    totalSpent: add(base.totalSpent, input.grandTotal),
    firstOrderAt: input.orderCreatedAt < base.firstOrderAt ? input.orderCreatedAt : base.firstOrderAt,
    lastOrderAt: input.orderCreatedAt > base.lastOrderAt ? input.orderCreatedAt : base.lastOrderAt,
    updatedAt: input.orderCreatedAt,
  };

  return { ...next, searchTokens: buildCustomerSearchTokens(next) };
}

/**
 * Reverses a cancelled order's contribution to `totalSpent` — called from
 * `services/orders/change-order-status.ts` when an order transitions to
 * `cancelled` after having already been counted. `totalOrders` is
 * deliberately left unchanged: a cancelled order still happened (a
 * customer's order-count history shouldn't silently shrink), but its
 * amount should no longer count toward spend. Never lets `totalSpent` go
 * negative (a defensive floor only — correct bookkeeping should never
 * actually hit it).
 */
export function reverseCancelledOrderSpend(existing: Customer, cancelledOrderTotal: Money, now: Date): Customer {
  const reduced = subtract(existing.totalSpent, cancelledOrderTotal);
  return {
    ...existing,
    totalSpent: reduced.amount < 0 ? { amount: 0, currency: ACTIVE_CURRENCY.code } : reduced,
    updatedAt: now,
  };
}

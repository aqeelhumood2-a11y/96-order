import type { Money } from "@/core/money/money";

/**
 * `guest` is every customer Phase 6 ever creates — checkout has no
 * authenticated customer session (see Phase 5 README's Known
 * limitations). `registered` and `userId` are modeled now, unwritten
 * until a future customer-accounts phase exists, so linking a `Customer`
 * to a real account later is an additive field change, not a redesign —
 * see README's Future integration seams.
 */
export const CUSTOMER_KINDS = ["guest", "registered"] as const;
export type CustomerKind = (typeof CUSTOMER_KINDS)[number];

/**
 * A derived aggregate over `Order.customer` snapshots, keyed by normalized
 * email (see `core/customer/rules.ts#customerKeyFromEmail`) — checkout
 * always requires and normalizes an email (`services/checkout/validation.ts`),
 * so it's a stable, collision-resistant natural key without needing a
 * separate generated id or an account signup step. Upserted transactionally
 * every time an order is created (`services/customers/upsert-customer-from-order.ts`),
 * never edited directly by an admin — `fullName`/`mobile`/`companyName`
 * always reflect the customer's *most recent* order, the same "latest
 * snapshot wins" convention `Order.customer` itself uses for name changes.
 */
export interface Customer {
  /** Normalized email — see `customerKeyFromEmail`. Never the Firestore auto-id. */
  id: string;
  kind: CustomerKind;
  /** A future registered-account uid — always unset in Phase 6. */
  userId?: string;
  fullName: string;
  email: string;
  mobile: string;
  companyName?: string;
  totalOrders: number;
  /** Sum of every non-cancelled order's `grandTotal` — a cancelled order never counts toward spend. */
  totalSpent: Money;
  firstOrderAt: Date;
  lastOrderAt: Date;
  /** Denormalized admin search index — see `core/customer/rules.ts#buildCustomerSearchTokens`. */
  searchTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

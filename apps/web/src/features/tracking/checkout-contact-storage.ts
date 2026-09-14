export interface CheckoutContact {
  mobile: string;
  email: string;
}

const STORAGE_KEY_PREFIX = "checkout-contact:";

/**
 * Tab-scoped only (`sessionStorage`) — never sent to the server, never part
 * of a URL. Lets the customer who just placed an order skip re-typing their
 * mobile/email on `/checkout/success`, without weakening the verified
 * lookup that keeps a shared/forwarded confirmation link from exposing
 * someone else's order details (see `OrderLookupForm`'s doc comment).
 */
export function saveCheckoutContactForLookup(orderNumber: string, contact: CheckoutContact): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + orderNumber, JSON.stringify(contact));
  } catch {
    // Private browsing / storage disabled — the lookup form just falls back
    // to asking the customer to type it in, same as before this existed.
  }
}

/**
 * Deliberately doesn't delete the entry after reading — a refresh (or a
 * card payment's round trip through Tap's hosted page and back) should
 * still auto-fill, and this never leaves the tab, so there's no downside
 * to it outliving a single read.
 */
export function readCheckoutContactForLookup(orderNumber: string): CheckoutContact | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + orderNumber);
    return raw ? (JSON.parse(raw) as CheckoutContact) : null;
  } catch {
    return null;
  }
}

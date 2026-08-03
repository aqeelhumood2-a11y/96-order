/**
 * The real, login-capable customer identity — deliberately a *separate*
 * aggregate from `core/customer/entities.ts#Customer` (the order-derived
 * spend/history rollup Phase 6 built). `Customer` is keyed by normalized
 * email and exists for every order ever placed, guest or not; a
 * `CustomerAccount` only exists once someone actually registers. They
 * share the same key space (a `CustomerAccount`'s `uid` becomes
 * `Customer.userId`, and `Customer.id` — the normalized email — is what
 * links them, see `core/customer/rules.ts`), but neither is a subset of
 * the other, so keeping them as two documents (not one merged shape)
 * means an account can be deactivated/deleted without touching order
 * history, and order history accrues for guests who never register at
 * all.
 */
export const CUSTOMER_ACCOUNT_STATUSES = ["active", "deactivated"] as const;
export type CustomerAccountStatus = (typeof CUSTOMER_ACCOUNT_STATUSES)[number];

/**
 * Transactional notifications (order updates, a question being answered,
 * a review's moderation outcome) are modeled as individually toggleable
 * preferences, same as marketing — but `marketingConsent` (below) is the
 * one flag actually enforced as an opt-in gate before a promotional email
 * is ever sent; these four are a customer's own delivery preference for
 * messages the app would otherwise send anyway, not a legal consent
 * record. See README's Customer Notifications section for the distinction.
 */
export interface NotificationPreferences {
  orderUpdates: boolean;
  backInStock: boolean;
  promotions: boolean;
  questionAnswered: boolean;
  reviewStatusChanges: boolean;
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return { orderUpdates: true, backInStock: true, promotions: false, questionAnswered: true, reviewStatusChanges: true };
}

export interface CustomerAccount {
  /** Firebase Auth uid — the same identity space `StaffUser.uid` uses, but never the same *document*; see this file's doc comment. */
  uid: string;
  /** Normalized (trimmed, lowercased) — the same normalization `core/customer/rules.ts#customerKeyFromEmail` applies, so this always matches a `Customer.id` for the same person. */
  email: string;
  displayName: string;
  mobile?: string;
  status: CustomerAccountStatus;
  /**
   * Never true until `services/customer-auth/verify-email.ts` confirms
   * ownership via a mailed one-time link — see
   * `core/interfaces/customer-email-verification-repository.ts` for why
   * the token itself is never stored on this document.
   */
  emailVerified: boolean;
  /** Marketing/promotional email opt-in — tracked separately from `notificationPreferences.promotions` is intentionally the same flag; kept as its own named field because it's the one Phase 7 explicitly treats as a consent record (see README's Privacy section), not just a delivery preference. */
  marketingConsent: boolean;
  marketingConsentUpdatedAt?: Date;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  deactivatedAt?: Date;
}

/** A customer-facing account session — resolved from the `__Host-customer-session` cookie, structurally incapable of satisfying an admin `requireSession()` check since it's never looked up against `users/{uid}`. See `services/customer-auth/session.ts`. */
export interface CustomerSession {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

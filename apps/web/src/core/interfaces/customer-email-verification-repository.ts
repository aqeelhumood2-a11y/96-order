export interface EmailVerificationRecord {
  /** SHA-256 hash of the one-time token — see `core/customer-auth/rules.ts#generateVerificationToken`'s doc comment for why the raw token itself is never persisted. Doubles as the Firestore document id. */
  tokenHash: string;
  customerUid: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Port for the `customerEmailVerifications` collection — deliberately its
 * own collection, never a field on `CustomerAccount`, per README's
 * Security/Privacy requirement that no reset/verification secret lives on
 * a customer document. `deleteAllForCustomer` is called whenever a new
 * verification email is requested, so re-sending invalidates any
 * still-outstanding earlier link rather than leaving multiple valid
 * tokens alive at once.
 */
export interface CustomerEmailVerificationRepository {
  create(record: EmailVerificationRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteAllForCustomer(customerUid: string): Promise<void>;
}

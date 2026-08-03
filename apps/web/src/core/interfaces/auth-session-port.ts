export interface VerifiedIdToken {
  uid: string;
  email: string;
}

export interface AuthUserRecord {
  uid: string;
  email: string;
  disabled: boolean;
}

/**
 * Port around Firebase Authentication's server-side operations —
 * everything above this port talks to Auth only through these methods,
 * which is what keeps UI and route code from ever touching Firebase Admin
 * (or Identity Toolkit) directly.
 *
 * Most of these are Admin SDK calls. `signInWithPassword` and
 * `sendPasswordResetEmail` are the two exceptions: the Admin SDK has no
 * password-verification or email-delivery API at all (by design — Firebase
 * treats both as client-SDK operations), so this port's implementation
 * calls the same Identity Toolkit REST endpoints the client SDK calls
 * internally, just from our server instead of the browser. That's what
 * makes it possible for our own rate limiter to sit in front of both —
 * see services/auth/create-session.ts and request-password-reset.ts.
 */
export interface AuthSessionPort {
  /**
   * Verifies a password directly against Identity Toolkit, server-side.
   * Must throw a single generic error for every failure case (wrong
   * password, unknown email, disabled account) — the caller relies on
   * this to avoid leaking which one it was.
   */
  signInWithPassword(email: string, password: string): Promise<{ idToken: string }>;
  verifyIdToken(idToken: string): Promise<VerifiedIdToken>;
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  /** `checkRevoked: true` is mandatory here — see services/auth/session.ts for why. */
  verifySessionCookie(sessionCookie: string, checkRevoked: true): Promise<VerifiedIdToken | null>;
  revokeRefreshTokens(uid: string): Promise<void>;
  getUserByEmail(email: string): Promise<AuthUserRecord | null>;
  /** Creates an Auth user with no password set — they set one via the password-reset email sent immediately after. Staff onboarding only — see `createUserWithPassword` for customer self-registration. */
  createUser(email: string): Promise<AuthUserRecord>;
  /** Customer self-registration only — unlike `createUser`, the customer sets their password at signup time, so it's created directly rather than via a follow-up reset email. Throws `ConflictError` if the email is already in use (staff and customers share one Firebase Auth project's email namespace — see README's Known limitations). */
  createUserWithPassword(email: string, password: string): Promise<AuthUserRecord>;
  setSuperAdminClaim(uid: string): Promise<void>;
  /**
   * Triggers Firebase's own hosted password-reset email delivery
   * server-side (Identity Toolkit's `sendOobCode`, the same call the
   * client SDK's `sendPasswordResetEmail` makes internally). Never
   * returns or exposes the reset link itself — delivery is the only
   * observable effect, by design, so no caller can ever surface the link
   * in a response, log, or UI. Must resolve without throwing regardless
   * of whether the email exists, so callers can't distinguish the two.
   */
  sendPasswordResetEmail(email: string): Promise<void>;
}

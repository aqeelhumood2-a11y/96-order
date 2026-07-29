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
 * Port around Firebase Authentication's server-side (Admin SDK) operations.
 * `infrastructure/firebase/auth-session.ts` is the only place that actually
 * imports `firebase-admin/auth` — everything above this port talks to Auth
 * only through these methods, which is what keeps UI and route code from
 * ever touching Firebase Admin directly.
 */
export interface AuthSessionPort {
  verifyIdToken(idToken: string): Promise<VerifiedIdToken>;
  createSessionCookie(idToken: string, expiresInMs: number): Promise<string>;
  /** `checkRevoked: true` is mandatory here — see services/auth/session.ts for why. */
  verifySessionCookie(sessionCookie: string, checkRevoked: true): Promise<VerifiedIdToken | null>;
  revokeRefreshTokens(uid: string): Promise<void>;
  getUserByEmail(email: string): Promise<AuthUserRecord | null>;
  /** Creates an Auth user with no password set — they set one via the reset-password link sent immediately after. */
  createUser(email: string): Promise<AuthUserRecord>;
  setSuperAdminClaim(uid: string): Promise<void>;
  generatePasswordResetLink(email: string): Promise<string>;
}

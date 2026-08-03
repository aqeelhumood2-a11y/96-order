import { createHash, randomBytes } from "node:crypto";

/**
 * A fresh, high-entropy one-time token plus its SHA-256 hash — the raw
 * token is what goes in the emailed link (`/account/verify-email?token=`)
 * and is never persisted anywhere; only `hash` is stored
 * (`CustomerEmailVerificationRepository`), so a Firestore read alone can
 * never yield a usable token — the same "never store the secret itself"
 * discipline `core/interfaces/auth-session-port.ts#sendPasswordResetEmail`'s
 * doc comment describes for Firebase's own hosted reset flow, applied here
 * because email verification has no Firebase-hosted equivalent this app
 * uses (see README's Customer auth architecture section for why).
 */
export interface VerificationToken {
  token: string;
  hash: string;
}

const TOKEN_BYTES = 32;

export function generateVerificationToken(): VerificationToken {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  return { token, hash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function isVerificationTokenExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

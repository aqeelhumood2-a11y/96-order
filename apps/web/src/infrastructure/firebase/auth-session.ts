import "server-only";
import { ConflictError, InternalError, RateLimitedError, UnauthorizedError } from "@/core/errors";
import type { AuthSessionPort, AuthUserRecord, VerifiedIdToken } from "@/core/interfaces/auth-session-port";
import { getAdminAuth } from "./admin";
import { IdentityToolkitError, sendOobCodeRest, signInWithPasswordRest } from "./identity-toolkit-rest";

function isFirebaseAuthError(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === code;
}

const GENERIC_CREDENTIALS_MESSAGE = "Invalid email or password.";

export class FirebaseAuthSession implements AuthSessionPort {
  async signInWithPassword(email: string, password: string): Promise<{ idToken: string }> {
    try {
      const result = await signInWithPasswordRest(email, password);
      return { idToken: result.idToken };
    } catch (error) {
      if (error instanceof IdentityToolkitError && error.code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        // Firebase's own abuse protection tripped — surfaced as the same
        // rate-limited response shape as our own limiter, not a distinct
        // error class, so callers don't need to special-case it.
        throw new RateLimitedError("Too many sign-in attempts. Try again shortly.");
      }
      // Every other failure (unknown email, wrong password, disabled
      // account, malformed request) collapses to the same generic
      // message — the whole point is that a caller can't tell these apart.
      throw new UnauthorizedError(GENERIC_CREDENTIALS_MESSAGE, { cause: error });
    }
  }

  async verifyIdToken(idToken: string): Promise<VerifiedIdToken> {
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      if (!decoded.email) {
        throw new UnauthorizedError("The authenticated account has no email address.");
      }
      return { uid: decoded.uid, email: decoded.email };
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError("Invalid or expired sign-in token.", { cause: error });
    }
  }

  async createSessionCookie(idToken: string, expiresInMs: number): Promise<string> {
    try {
      return await getAdminAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
    } catch (error) {
      throw new UnauthorizedError("Could not start a session for this sign-in.", { cause: error });
    }
  }

  async verifySessionCookie(sessionCookie: string): Promise<VerifiedIdToken | null> {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      if (!decoded.email) return null;
      return { uid: decoded.uid, email: decoded.email };
    } catch {
      return null;
    }
  }

  async revokeRefreshTokens(uid: string): Promise<void> {
    await getAdminAuth().revokeRefreshTokens(uid);
  }

  async getUserByEmail(email: string): Promise<AuthUserRecord | null> {
    try {
      const user = await getAdminAuth().getUserByEmail(email);
      if (!user.email) return null;
      return { uid: user.uid, email: user.email, disabled: user.disabled };
    } catch (error) {
      if (isFirebaseAuthError(error, "auth/user-not-found")) return null;
      throw new InternalError("Could not look up the Firebase Auth user.", { cause: error });
    }
  }

  async createUser(email: string): Promise<AuthUserRecord> {
    try {
      const user = await getAdminAuth().createUser({ email, emailVerified: false, disabled: false });
      return { uid: user.uid, email, disabled: false };
    } catch (error) {
      if (isFirebaseAuthError(error, "auth/email-already-exists")) {
        throw new ConflictError("A Firebase Auth account with this email already exists.", { cause: error });
      }
      throw new InternalError("Could not create the Firebase Auth user.", { cause: error });
    }
  }

  async setSuperAdminClaim(uid: string): Promise<void> {
    await getAdminAuth().setCustomUserClaims(uid, { sa: true });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // Errors are deliberately swallowed here too (belt-and-suspenders with
    // the REST helper already doing the same) — this call's only
    // observable effect from any caller's perspective is "an email may
    // have been sent," never a distinguishable success/failure.
    await sendOobCodeRest(email).catch(() => undefined);
  }
}

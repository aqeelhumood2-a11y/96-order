import "server-only";
import { InternalError } from "@/core/errors";
import { logger } from "@/lib/logger";

/**
 * Thin fetch wrapper around the two Identity Toolkit REST operations that
 * have no Admin SDK equivalent (password verification, OOB email sending —
 * Firebase treats both as client-SDK-only by design). Calling them from
 * our own server instead of the browser is what lets our rate limiter sit
 * in front of both. Never used for anything Admin SDK already covers.
 */

export class IdentityToolkitError extends Error {
  constructor(public readonly code: string) {
    super(`Identity Toolkit error: ${code}`);
    this.name = "IdentityToolkitError";
  }
}

function baseUrl(): string {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  return emulatorHost
    ? `http://${emulatorHost}/identitytoolkit.googleapis.com/v1`
    : "https://identitytoolkit.googleapis.com/v1";
}

function apiKey(): string {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    throw new InternalError("NEXT_PUBLIC_FIREBASE_API_KEY is not configured.");
  }
  return key;
}

interface IdentityToolkitErrorBody {
  error?: { message?: string };
}

export interface SignInWithPasswordResult {
  idToken: string;
  localId: string;
  email: string;
}

export async function signInWithPasswordRest(email: string, password: string): Promise<SignInWithPasswordResult> {
  const response = await fetch(`${baseUrl()}/accounts:signInWithPassword?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const body = (await response.json().catch(() => ({}))) as IdentityToolkitErrorBody & Partial<SignInWithPasswordResult>;

  if (!response.ok) {
    throw new IdentityToolkitError(body.error?.message ?? "UNKNOWN_ERROR");
  }

  if (!body.idToken || !body.localId || !body.email) {
    throw new IdentityToolkitError("MALFORMED_RESPONSE");
  }

  return { idToken: body.idToken, localId: body.localId, email: body.email };
}

/**
 * No caller ever reads or returns the outcome of this call beyond "did the
 * HTTP request complete" — see the port doc comment for why silence is the
 * point *for the client*: the HTTP response to the browser must never
 * distinguish "email sent" from "email failed," or a caller could enumerate
 * which addresses have accounts.
 *
 * That's a client-facing constraint, not a server-side one. This still
 * logs the real outcome server-side (Vercel/log-aggregator visible only,
 * never returned to any caller) — `EMAIL_NOT_FOUND` is the expected,
 * frequent, harmless case (someone requesting a reset for an address with
 * no account) and logs at `debug`; anything else — a misconfigured Firebase
 * Auth email template, a restricted API key, a quota limit — is a real
 * delivery problem and logs at `warn` so it actually shows up when
 * "password reset emails aren't arriving" needs diagnosing.
 */
export async function sendOobCodeRest(email: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/accounts:sendOobCode?key=${apiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    });
  } catch (error) {
    logger.error("Password reset email: request to Identity Toolkit failed", {
      message: error instanceof Error ? error.message : "Unknown network error",
    });
    return;
  }

  const body = (await response.json().catch(() => ({}))) as IdentityToolkitErrorBody;

  if (!response.ok) {
    const code = body.error?.message ?? "UNKNOWN_ERROR";
    if (code === "EMAIL_NOT_FOUND") {
      logger.debug("Password reset email: no account for this address", { status: response.status });
    } else {
      logger.warn("Password reset email: Identity Toolkit rejected the request", { status: response.status, code });
    }
  }
}

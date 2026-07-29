import "server-only";
import { InternalError } from "@/core/errors";

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
 * Fire-and-inspect only in tests: production code never reads or returns
 * the outcome of this call beyond "did the HTTP request complete" — see
 * the port doc comment for why silence is the point.
 */
export async function sendOobCodeRest(email: string): Promise<void> {
  const response = await fetch(`${baseUrl()}/accounts:sendOobCode?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  await response.json().catch(() => undefined);
}

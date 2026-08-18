import "server-only";
import { getApps, initializeApp, applicationDefault, cert, type App, type Credential } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { logger } from "@/lib/logger";

/**
 * Undoes the two most common ways a service-account field gets mangled by a
 * copy-paste into a dashboard text field: a wrapping pair of quote
 * characters carried over from viewing the source JSON (`"-----BEGIN...`),
 * and incidental leading/trailing whitespace or a trailing newline. Applied
 * to all three `FIREBASE_ADMIN_*` fields, not just the private key — a
 * stray trailing space on `FIREBASE_ADMIN_CLIENT_EMAIL` fails Google's auth
 * exchange just as completely as a malformed key, with a far more confusing
 * error message.
 */
function cleanCredentialField(value: string): string {
  const trimmed = value.trim();
  const unquoted = (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")) ? trimmed.slice(1, -1) : trimmed;
  return unquoted.trim();
}

/**
 * Server-only Firebase Admin SDK singleton. Supports two credential modes:
 *
 * - Explicit service-account credentials via `FIREBASE_ADMIN_PROJECT_ID` /
 *   `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY` — required
 *   on hosting platforms with no Google metadata server to query (Vercel,
 *   most non-GCP hosts), where `applicationDefault()` has nothing to
 *   discover. Populate these three from a downloaded service-account JSON's
 *   `project_id` / `client_email` / `private_key` fields — never commit
 *   that JSON file, and never paste its contents anywhere else in this repo.
 * - `applicationDefault()` (Application Default Credentials) when none of
 *   the three are set — the right choice on a Google Cloud runtime (Cloud
 *   Functions, Cloud Run, GCE, Firebase App Hosting), which attaches
 *   credentials automatically, or locally after
 *   `gcloud auth application-default login` / a `GOOGLE_APPLICATION_CREDENTIALS`-
 *   pointed key file.
 *
 * Setting only one or two of the three `FIREBASE_ADMIN_*` variables is
 * always a misconfiguration (a truncated or partially-copied credential),
 * never a deliberate choice — that fails loudly with a diagnostic naming
 * exactly what's missing, instead of silently falling back to ADC under
 * the wrong identity.
 *
 * Against the Firebase Emulator Suite, the Admin SDK auto-detects the
 * `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` /
 * `FIREBASE_STORAGE_EMULATOR_HOST` env vars that `firebase emulators:start`
 * exports and needs no credential at all in that mode.
 */
function resolveAdminCredential(): { credential: Credential; projectId?: string } {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const presentCount = [projectId, clientEmail, privateKey].filter(Boolean).length;

  if (presentCount === 3) {
    const cleanedProjectId = cleanCredentialField(projectId!);
    const cleanedClientEmail = cleanCredentialField(clientEmail!);
    // Env vars can't carry real newlines portably (Vercel's dashboard, shell
    // exports, CI secret stores all flatten them to literal "\n" sequences)
    // — this reverses that so the PEM block parses. Applied after
    // `cleanCredentialField` strips any wrapping quotes, since a quoted
    // paste from the source JSON file carries literal `\n` sequences too.
    const cleanedPrivateKey = cleanCredentialField(privateKey!).replace(/\\n/g, "\n");

    try {
      return {
        credential: cert({ projectId: cleanedProjectId, clientEmail: cleanedClientEmail, privateKey: cleanedPrivateKey }),
        projectId: cleanedProjectId,
      };
    } catch (error) {
      // `cert()` throws synchronously on a malformed PEM block or client
      // email — this is the single most common real-world cause of every
      // Firestore/Auth-backed action failing identically in production
      // (page reads can still serve stale cached data; nothing about a
      // Server Action is ever cached, so it fails immediately and visibly).
      // Logged here, not just re-thrown, so it shows up as a clean,
      // searchable line in Vercel's function logs instead of only a raw
      // stack trace three layers of Next.js internals deep.
      logger.error("Firebase Admin credential is present but invalid — cert() rejected it", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  if (presentCount === 0) {
    return { credential: applicationDefault() };
  }

  const missing = [
    !projectId && "FIREBASE_ADMIN_PROJECT_ID",
    !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
    !privateKey && "FIREBASE_ADMIN_PRIVATE_KEY",
  ].filter((name): name is string => Boolean(name));

  logger.error("Firebase Admin credentials are incomplete", { missing });
  throw new Error(
    `Incomplete Firebase Admin service-account credentials — missing ${missing.join(", ")}. ` +
      "Set all three of FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and " +
      "FIREBASE_ADMIN_PRIVATE_KEY together (from your service account's project_id / " +
      "client_email / private_key fields), or leave all three unset to use Application " +
      "Default Credentials instead.",
  );
}

function createAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    return existing[0];
  }

  const usingEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (usingEmulators) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      logger.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set (emulator mode)");
      throw new Error(
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Required even against the Firebase " +
          "Emulator Suite so the Admin SDK knows which demo project to address.",
      );
    }
    // The `credential` key must be entirely absent for the emulator case —
    // Firebase's own options validation rejects `credential: undefined` just
    // as strictly as an invalid credential object.
    return initializeApp({
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const resolved = resolveAdminCredential();
  const projectId = resolved.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    logger.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set (production mode)");
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. This is required at runtime for every " +
        "Firestore/Auth/Storage-backed route to reach the correct Firebase project — set it " +
        "in your deployment platform's environment variables (see docs/environment-variables.md), " +
        "or set FIREBASE_ADMIN_PROJECT_ID as part of a full service-account credential. " +
        "This only breaks on first use of a Firebase-backed route, not at build time.",
    );
  }

  return initializeApp({
    credential: resolved.credential,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

let app: App | undefined;

export function getAdminApp(): App {
  app ??= createAdminApp();
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * `ignoreUndefinedProperties` lets repositories build doc objects with
 * plain optional fields (`displayName: user.displayName`) instead of
 * conditionally spreading each one — Firestore rejects an explicit
 * `undefined` value the same way it rejects an invalid type, so without
 * this every optional field would need its own presence check at every
 * write site. Must be set before any other Firestore call on this
 * instance.
 *
 * The try/catch — not a module-level boolean — is what actually makes this
 * idempotent: Next.js's per-route SSR bundling can load separate module
 * instances of this file (each with its own module scope) that all resolve
 * to the same underlying Firebase App and Firestore instance via the SDK's
 * own global app registry, so a boolean guard here would only be "first
 * call" from one chunk's perspective, not a real global guard. Firestore
 * itself throws if `.settings()` is called more than once on the same
 * instance — which is exactly the signal that another chunk already
 * applied it — so that specific error is the one we swallow. The module-
 * level flag is kept as a fast path so the try/catch only runs once per
 * chunk instance, not on every single Firestore access.
 */
let firestoreSettingsAttempted = false;

export function getAdminFirestore(): Firestore {
  const firestore = getFirestore(getAdminApp());
  if (!firestoreSettingsAttempted) {
    firestoreSettingsAttempted = true;
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch (error) {
      const alreadyInitialized = error instanceof Error && error.message.includes("already been initialized");
      if (!alreadyInitialized) throw error;
    }
  }
  return firestore;
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

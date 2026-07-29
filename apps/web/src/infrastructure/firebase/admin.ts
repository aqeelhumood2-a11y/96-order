import "server-only";
import { getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-only Firebase Admin SDK singleton. Deliberately does NOT accept a
 * service-account JSON blob through env vars:
 *
 * - Deployed on a Google Cloud runtime (Cloud Functions, Cloud Run, GCE):
 *   `applicationDefault()` picks up that runtime's attached service account
 *   automatically — no credential material to manage at all.
 * - Local development: run `gcloud auth application-default login` once, or
 *   point `GOOGLE_APPLICATION_CREDENTIALS` at a local, gitignored key file.
 *   Never commit that file or paste its contents into an env var.
 * - Any other server-side secret this project needs later should go through
 *   Secret Manager, not a raw env var.
 *
 * Against the Firebase Emulator Suite, the Admin SDK auto-detects the
 * `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` /
 * `FIREBASE_STORAGE_EMULATOR_HOST` env vars that `firebase emulators:start`
 * exports and needs no credential at all in that mode.
 */
function createAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    return existing[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const usingEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  // The `credential` key must be entirely absent for the emulator case —
  // Firebase's own options validation rejects `credential: undefined` just
  // as strictly as an invalid credential object, so this can't be a
  // ternary on the value alone.
  return initializeApp({
    ...(usingEmulators ? {} : { credential: applicationDefault() }),
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

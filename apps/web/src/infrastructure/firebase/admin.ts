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

  return initializeApp({
    credential: usingEmulators ? undefined : applicationDefault(),
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

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

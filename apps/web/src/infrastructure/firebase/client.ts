import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { getEnv } from "@/lib/env";

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | undefined;

/**
 * Lazily creates (once) the Firebase client SDK singletons. Lazy so
 * importing this module has no side effects until something actually needs
 * Firebase, and cached so hot reload / multiple call sites never
 * re-initialize the app or reconnect the emulators.
 */
function getFirebaseServices(): FirebaseServices {
  if (services) {
    return services;
  }

  const env = getEnv();
  const existingApps = getApps();
  const app =
    existingApps.length > 0 && existingApps[0]
      ? existingApps[0]
      : initializeApp({
          apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
        });

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  services = { app, auth, firestore, storage };
  return services;
}

export function getFirebaseApp(): FirebaseApp {
  return getFirebaseServices().app;
}

export function getFirebaseAuth(): Auth {
  return getFirebaseServices().auth;
}

export function getFirebaseFirestore(): Firestore {
  return getFirebaseServices().firestore;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getFirebaseServices().storage;
}

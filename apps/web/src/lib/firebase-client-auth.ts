"use client";

import {
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseAuth } from "@/infrastructure/firebase/client";

/**
 * Thin browser-side wrapper around the Firebase client Auth SDK, for
 * `features/admin-auth`'s client components. This talks to Identity
 * Toolkit directly (never our server) — see create-session.ts and
 * request-password-reset.ts for what that means for rate limiting.
 */
export async function signInWithEmailAndPassword(email: string, password: string): Promise<string> {
  const credential = await firebaseSignInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user.getIdToken();
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await firebaseSendPasswordResetEmail(getFirebaseAuth(), email);
}

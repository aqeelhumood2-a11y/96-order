import "server-only";
import { JWT } from "google-auth-library";
import { cleanCredentialField } from "@/infrastructure/firebase/admin";
import { logger } from "@/lib/logger";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

let cachedClient: JWT | null = null;

/**
 * Mints a Drive-API-scoped access token by reusing this app's existing
 * Firebase Admin service-account credential (`FIREBASE_ADMIN_CLIENT_EMAIL` /
 * `FIREBASE_ADMIN_PRIVATE_KEY`) — already a required credential for this app
 * to run on Vercel at all (see `infrastructure/firebase/admin.ts`) — instead
 * of asking for a separate Google Cloud API key. That credential can't be
 * reused directly through the Firebase Admin SDK's own `Credential` object:
 * it requests a fixed scope list (`cloud-platform`, `firebase.database`,
 * `firebase.messaging`, `identitytoolkit`, `userinfo.email` — see
 * firebase-admin's `credential-internal.js`) that the Drive API's own scope
 * check does not reliably accept, so a second JWT client is minted from the
 * same underlying key pair, scoped specifically for Drive.
 *
 * Returns `null` (never throws for a missing credential) when
 * `FIREBASE_ADMIN_CLIENT_EMAIL`/`FIREBASE_ADMIN_PRIVATE_KEY` aren't set —
 * local dev against the emulator, or a GCP host relying on Application
 * Default Credentials, has no service-account key pair to build this from.
 * Callers should fall back to Drive's direct hotlink URL in that case
 * rather than fail outright, since those environments worked before this
 * proxy existed and should keep working exactly the same way.
 */
export async function getDriveAccessToken(): Promise<string | null> {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  cachedClient ??= new JWT({
    email: cleanCredentialField(clientEmail),
    key: cleanCredentialField(privateKey).replace(/\\n/g, "\n"),
    scopes: [DRIVE_READONLY_SCOPE],
  });

  try {
    const { token } = await cachedClient.getAccessToken();
    return token ?? null;
  } catch (error) {
    logger.error("Failed to mint a Google Drive API access token from the Firebase Admin service account", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

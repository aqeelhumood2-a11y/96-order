import { z } from "zod";

/**
 * Every env var the app needs, validated once at startup. Firebase's client
 * config values are NOT secrets (they're safe in the browser bundle by
 * design) but are still kept out of source so each environment (local,
 * preview, production) can point at a different Firebase project.
 *
 * Admin SDK credentials are deliberately absent here: server code
 * authenticates via Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS
 * locally, the platform's default service account when deployed) rather than
 * a service-account JSON blob passed through env vars. See
 * src/infrastructure/firebase/admin.ts.
 */
const envSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Parses and validates `process.env` on first access, then caches the
 * result. Throws immediately with a readable message if anything required is
 * missing or malformed, instead of failing confusingly deep inside Firebase
 * SDK initialization.
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n\nCopy .env.example to .env.local and fill in your Firebase project's values.`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

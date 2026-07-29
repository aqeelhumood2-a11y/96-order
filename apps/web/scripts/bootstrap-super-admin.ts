/**
 * One-time super-admin bootstrap. Run with:
 *
 *   pnpm --filter web run bootstrap:super-admin -- --email=someone@example.com
 *
 * This is a plain script, not a Next.js route — it is structurally
 * impossible to reach over HTTP. It requires the target Firebase Auth user
 * to already exist (create it via the Firebase Console or a separate
 * Admin SDK call first); this script never receives or handles a raw
 * password. It is idempotent: once `system/bootstrap.superAdminInitialized`
 * is true, every subsequent run is a no-op. Every later super admin is
 * promoted through normal in-app role assignment by an existing one, not by
 * running this script again.
 *
 * Requires Application Default Credentials to be available in this shell —
 * see the root README's "Bootstrap the first super admin" section.
 *
 * (Runs with `--conditions=react-server` — set via this package's
 * `bootstrap:super-admin` script — so the `server-only` import guards in
 * infrastructure/firebase/*.ts resolve to their no-op build instead of
 * throwing; that guard exists to keep those modules out of the browser
 * bundle, which doesn't apply to this standalone script.)
 */
import { bootstrapSuperAdmin } from "@/services/auth/bootstrap-super-admin";
import { isAppError } from "@/core/errors";

function parseEmailArg(argv: string[]): string {
  const arg = argv.find((value) => value.startsWith("--email="));
  const email = arg?.slice("--email=".length);
  if (!email) {
    console.error('Usage: pnpm --filter web run bootstrap:super-admin -- --email="someone@example.com"');
    process.exit(1);
  }
  return email;
}

async function main() {
  const email = parseEmailArg(process.argv.slice(2));

  try {
    const result = await bootstrapSuperAdmin({ email });

    if (result.alreadyInitialized) {
      console.log("Super admin has already been initialized for this project. Nothing to do.");
      console.log("To grant super_admin to another user, assign the role in-app instead of re-running this script.");
      return;
    }

    console.log(`Super admin bootstrap complete for ${email} (uid: ${result.uid}).`);
  } catch (error) {
    if (isAppError(error)) {
      console.error(`Bootstrap failed: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

void main();

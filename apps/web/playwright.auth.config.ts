import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Populates process.env from .env.test — used directly by this process
// (e.g. globalSetup.ts's Admin SDK init) and passed explicitly to
// `webServer.env` below, since Next.js inlines NEXT_PUBLIC_* vars into the
// client bundle at build time and that build runs in a spawned child
// process whose env inheritance shouldn't be assumed.
loadEnv({ path: path.join(__dirname, ".env.test") });

const sandboxChromium = "/opt/pw-browsers/chromium";
const executablePath = existsSync(sandboxChromium) ? sandboxChromium : undefined;

const definedProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

/**
 * For the specs that need a real Firebase Auth + Firestore backend:
 * auth.spec.ts (Phase 2), catalog.spec.ts (Phase 3 admin catalog flows),
 * storefront.spec.ts (Phase 4 public storefront — every storefront
 * page reads from Firestore, so it needs this backend just as much as the
 * admin specs do), and checkout.spec.ts (Phase 5 — cart/checkout/order
 * tracking, all backed by Firestore; card payment uses `FakeTapProvider`
 * automatically, since `TAP_SECRET_KEY` is deliberately absent from
 * `.env.test`, so no real Tap sandbox account is needed here either), and
 * admin-orders.spec.ts (Phase 6 — order management, customers, dashboard,
 * reports; see its own doc comment for why it performs exactly one login
 * for its entire run), and customer-account.spec.ts (Phase 7 — customer
 * registration/wishlist/addresses, CMS page rendering, and cart coupons;
 * exactly one customer registration/login for its entire run, the same
 * shared-rate-limit-budget discipline admin-orders.spec.ts documents,
 * except against `config/customer-auth.ts`'s separate customer rate-limit
 * buckets rather than the staff ones). All six share this one config
 * rather than each needing their own. Run via
 * `pnpm run test:e2e:auth` at the repo root, which wraps this in
 * `firebase emulators:exec`. The plain `tests/e2e/not-found.spec.ts` is
 * the only spec that needs no Firebase backend at all, so it alone keeps
 * using playwright.config.ts.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["auth.spec.ts", "catalog.spec.ts", "storefront.spec.ts", "checkout.spec.ts", "admin-orders.spec.ts", "customer-account.spec.ts"],
  outputDir: "./test-results-auth",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  // Every spec here shares one live, un-reset Firestore/Auth emulator
  // instance for the whole run (see catalog.spec.ts's own doc comment on
  // why it keeps its state-mutating steps sequential within itself) —
  // several list pages this suite asserts against (e.g. `/admin/inventory`,
  // `/admin/products`) are unscoped queries over the *entire* collection,
  // not filtered to one spec's own fixtures. `fullyParallel: false` alone
  // only serializes tests *within* one file; Playwright's default worker
  // count still runs *different* spec files concurrently against that same
  // shared backend, which is exactly the collision hazard (one file's
  // fixture product briefly appearing on another file's "exactly one row"
  // assertion) `workers: 1` closes off entirely, at the cost of this suite
  // running spec files one at a time instead of two.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-auth" }]]
    : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], launchOptions: executablePath ? { executablePath } : {} },
    },
  ],
  webServer: {
    // Next.js's Data Cache (what `unstable_cache`, used throughout
    // services/storefront/*, is backed by in a self-hosted `next start`
    // deployment) is a *filesystem* cache under `.next/cache/`, not purely
    // in-memory — `next build` does not clear it, by design, so it survives
    // both a rebuild and a fresh server process. This run always pairs a
    // freshly-started Firestore emulator (no import/export configured in
    // firebase.json, so every `emulators:exec` invocation starts empty)
    // with the Next.js server; without clearing `.next/cache` first, a
    // second local run would pair that empty emulator with a cache still
    // remembering a *previous* run's (now-gone) data — exactly the kind of
    // stale-read bug this suite exists to catch, not reproduce by accident.
    command: "rm -rf .next/cache && pnpm run build && pnpm run start",
    url: "http://127.0.0.1:3000",
    // Also always fresh, for the same reason — a reused server process
    // would keep its in-memory request-level caches from a prior run too.
    reuseExistingServer: false,
    timeout: 120_000,
    env: definedProcessEnv,
  },
});

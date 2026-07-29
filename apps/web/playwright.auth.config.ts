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
 * Only for tests/e2e/auth.spec.ts — the one spec that needs a real Firebase
 * Auth + Firestore backend. Run via `pnpm run test:e2e:auth` at the repo
 * root, which wraps this in `firebase emulators:exec`. The plain
 * `tests/e2e/homepage.spec.ts` keeps using playwright.config.ts and never
 * needs the emulators.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "auth.spec.ts",
  outputDir: "./test-results-auth",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
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
    command: "pnpm run build && pnpm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: definedProcessEnv,
  },
});

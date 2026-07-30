import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This sandbox ships a pre-installed Chromium outside Playwright's normal
// cache; when present, point at it directly instead of triggering a
// download. Real CI (no such path) installs its own browsers and ignores this.
const sandboxChromium = "/opt/pw-browsers/chromium";
const executablePath = existsSync(sandboxChromium) ? sandboxChromium : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
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
    // Not "/" — the homepage is a real storefront page that reads
    // Firestore via the Admin SDK on every request (force-dynamic, no
    // static fallback), which fails without a real project or emulator
    // and would never let this readiness check succeed. `/robots.txt`
    // (app/robots.ts) is static and touches no Firebase API at all, so
    // it's a safe health-check target for this Firebase-free config.
    url: "http://127.0.0.1:3000/robots.txt",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

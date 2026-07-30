import { expect, test } from "@playwright/test";

/**
 * The one e2e spec that genuinely needs no Firebase backend at all (not
 * even the emulator) — `not-found.tsx` renders without touching Firestore,
 * so this is the only spec left running under the plain, emulator-free
 * `playwright.config.ts` / `pnpm run test:e2e`. Every other page in the app
 * (the storefront included, as of Phase 4) reads from Firestore, so those
 * specs run under `playwright.auth.config.ts` / `pnpm run test:e2e:auth`
 * instead — see storefront.spec.ts, auth.spec.ts, and catalog.spec.ts.
 */
test("an unknown route renders the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

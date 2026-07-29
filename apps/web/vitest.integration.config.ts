import { config as loadEnv } from "dotenv";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Populates process.env from .env.test before Vitest spawns test workers
// (which inherit it) — this is the fixed demo project config the emulator
// suite and these tests run against, never a real project.
loadEnv({ path: new URL(".env.test", import.meta.url).pathname });

/**
 * A separate, Next-free Vitest project for tests that need a real Firebase
 * Emulator Suite backend (Firestore adapters, security rules). Only run
 * via `pnpm run test:integration` at the repo root, which wraps this in
 * `firebase emulators:exec` — never as part of the plain `pnpm test`.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});

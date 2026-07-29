import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const architectureLayers = [
  { type: "app", pattern: "src/app/**" },
  { type: "core", pattern: "src/core/**" },
  { type: "features", pattern: "src/features/**" },
  { type: "services", pattern: "src/services/**" },
  { type: "infrastructure", pattern: "src/infrastructure/**" },
  { type: "ui", pattern: "src/ui/**" },
  { type: "lib", pattern: "src/lib/**" },
  { type: "config", pattern: "src/config/**" },
  { type: "types", pattern: "src/types/**" },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": architectureLayers,
    },
    rules: {
      // Enforces Clean Architecture's dependency direction: `core` stays
      // pure, `infrastructure` implements `core`'s ports, and `features`/`app`
      // never reach past `services` into concrete infrastructure. This is
      // what lets a future module plug in without the existing layers
      // needing to change.
      //
      // One narrow, deliberate exception added in Phase 2: `lib` may import
      // `core`. `core` is the innermost ring (it depends on nothing else)
      // so this can never create a cycle; it exists so
      // `lib/action-result.ts` can map thrown `AppError`s (`core/errors`)
      // to a typed Server Action result without every feature duplicating
      // that mapping.
      //
      // A second exception (`lib` -> `infrastructure`, for a client-side
      // Firebase Auth SDK wrapper) existed briefly in Phase 2 but has since
      // been removed: login and password reset now go through
      // rate-limited server endpoints instead of the client SDK, so no
      // browser code needs to touch Firebase directly anymore. `lib`,
      // `features`, `ui`, and `app` all cannot import `infrastructure`
      // directly — only `services` and `infrastructure` itself can, which
      // is the composition-root boundary (see services/auth/dependencies.ts).
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "core", allow: ["core", "types"] },
            { from: "lib", allow: ["lib", "core", "types"] },
            { from: "config", allow: ["config", "lib", "types"] },
            { from: "types", allow: ["types"] },
            { from: "infrastructure", allow: ["infrastructure", "core", "lib", "config", "types"] },
            { from: "services", allow: ["services", "core", "infrastructure", "lib", "config", "types"] },
            { from: "ui", allow: ["ui", "lib", "config", "types"] },
            { from: "features", allow: ["features", "core", "services", "ui", "lib", "config", "types"] },
            {
              from: "app",
              allow: ["app", "features", "services", "ui", "lib", "config", "core", "types"],
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;

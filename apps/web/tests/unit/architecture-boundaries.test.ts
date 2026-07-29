import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import { afterEach, describe, expect, it } from "vitest";

/**
 * These prove the Clean Architecture boundary rule (`eslint-plugin-boundaries`
 * in eslint.config.mjs) actually rejects the imports it's supposed to —
 * not just that the rule is configured, but that it fires. Fixture files
 * are written to real paths under `src/` (not virtual paths) because the
 * project's type-aware lint config needs a file `tsc` can actually see;
 * they're removed in `afterEach` regardless of test outcome.
 */

const WEB_ROOT = path.resolve(__dirname, "../..");
const eslint = new ESLint({ cwd: WEB_ROOT });

const writtenFiles: string[] = [];

function fixturePath(relativeToSrc: string): string {
  return path.join(WEB_ROOT, "src", relativeToSrc);
}

async function lintFixture(relativeToSrc: string, code: string) {
  const filePath = fixturePath(relativeToSrc);
  writeFileSync(filePath, code, "utf8");
  writtenFiles.push(filePath);
  const results = await eslint.lintFiles([filePath]);
  return results[0]?.messages.filter((message) => message.ruleId === "boundaries/element-types") ?? [];
}

afterEach(() => {
  for (const file of writtenFiles.splice(0)) {
    rmSync(file, { force: true });
  }
});

describe("architecture boundaries", () => {
  it("blocks features from importing infrastructure directly", async () => {
    const messages = await lintFixture(
      "features/__boundary_fixture_features.ts",
      'import { getAdminFirestore } from "@/infrastructure/firebase/admin";\nexport const x = getAdminFirestore;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("blocks app routes from importing infrastructure directly", async () => {
    const messages = await lintFixture(
      "app/__boundary_fixture_app.ts",
      'import { getAdminFirestore } from "@/infrastructure/firebase/admin";\nexport const x = getAdminFirestore;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("blocks ui primitives from importing infrastructure directly", async () => {
    const messages = await lintFixture(
      "ui/__boundary_fixture_ui.ts",
      'import { getAdminFirestore } from "@/infrastructure/firebase/admin";\nexport const x = getAdminFirestore;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("blocks lib from importing infrastructure (no exception remains after Phase 2 corrections)", async () => {
    const messages = await lintFixture(
      "lib/__boundary_fixture_lib.ts",
      'import { getAdminFirestore } from "@/infrastructure/firebase/admin";\nexport const x = getAdminFirestore;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("blocks core from importing outward (services)", async () => {
    const messages = await lintFixture(
      "core/__boundary_fixture_core.ts",
      'import { requireSession } from "@/services/auth/session";\nexport const x = requireSession;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("allows services to import infrastructure — the composition root", async () => {
    const messages = await lintFixture(
      "services/__boundary_fixture_services.ts",
      'import { getAdminFirestore } from "@/infrastructure/firebase/admin";\nexport const x = getAdminFirestore;\n',
    );
    expect(messages).toHaveLength(0);
  });

  it("allows lib to import core (action-result's error mapping)", async () => {
    const messages = await lintFixture(
      "lib/__boundary_fixture_lib_core.ts",
      'import { isAppError } from "@/core/errors";\nexport const x = isAppError;\n',
    );
    expect(messages).toHaveLength(0);
  });
});

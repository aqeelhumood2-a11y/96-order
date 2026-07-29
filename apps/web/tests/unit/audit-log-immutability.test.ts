import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";

const SRC_ROOT = path.resolve(__dirname, "../../src");

function collectSourceFiles(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      collectSourceFiles(fullPath, results);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.includes("__boundary_fixture")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("audit log immutability", () => {
  it("the port's concrete implementation has no update or delete method", () => {
    const repo = new FirestoreAuditLogRepository() as unknown as Record<string, unknown>;
    expect(repo.update).toBeUndefined();
    expect(repo.delete).toBeUndefined();
    expect(typeof repo.record).toBe("function");
    expect(typeof repo.list).toBe("function");
  });

  it("no file outside the repository implementation references the auditLogs collection name", () => {
    const offenders = collectSourceFiles(SRC_ROOT)
      .filter((file) => !file.endsWith("firestore-audit-log-repository.ts"))
      .filter((file) => {
        const content = readFileSync(file, "utf8");
        return content.includes('"auditLogs"') || content.includes("'auditLogs'");
      });

    expect(offenders).toEqual([]);
  });

  it("no services/ call ever invokes an update or delete against the auditLogs port", () => {
    const files = collectSourceFiles(path.join(SRC_ROOT, "services"));
    const allCalls: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const matches = content.match(/\bauditLogs\.\w+/g) ?? [];
      allCalls.push(...matches);
    }

    // Sanity check that this test isn't vacuously passing over zero matches.
    expect(allCalls.length).toBeGreaterThan(0);
    // .record (writing a new entry) and .list (reading, e.g. list-audit-logs.ts)
    // are the only legitimate calls — there is no .update/.delete to call at all.
    expect(new Set(allCalls)).toEqual(new Set(["auditLogs.record", "auditLogs.list"]));
  });
});

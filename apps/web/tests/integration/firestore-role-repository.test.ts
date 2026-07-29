import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreRoleRepository } from "@/infrastructure/firebase/repositories/firestore-role-repository";
import type { Role } from "@/core/auth/entities";

const repo = new FirestoreRoleRepository();

function makeRole(overrides: Partial<Role> = {}): Role {
  const now = new Date();
  return {
    id: randomUUID(),
    name: "Test Role",
    description: "A role created by an integration test.",
    permissions: ["dashboard:view"],
    isSystemRole: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    updatedBy: "test-runner",
    ...overrides,
  };
}

describe("FirestoreRoleRepository (emulator)", () => {
  it("creates and finds a role by id", async () => {
    const role = makeRole();
    await repo.create(role);

    const found = await repo.findById(role.id);
    expect(found?.name).toBe(role.name);
    expect(found?.permissions).toEqual(role.permissions);
  });

  it("returns null for an unknown role id", async () => {
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it("updates fields", async () => {
    const role = makeRole();
    await repo.create(role);

    await repo.update(role.id, { name: "Renamed", permissions: ["staff:view"], updatedBy: "someone-else" });

    const updated = await repo.findById(role.id);
    expect(updated?.name).toBe("Renamed");
    expect(updated?.permissions).toEqual(["staff:view"]);
  });

  it("deletes a role", async () => {
    const role = makeRole();
    await repo.create(role);
    await repo.delete(role.id);

    expect(await repo.findById(role.id)).toBeNull();
  });

  it("lists roles with pagination", async () => {
    const batchId = randomUUID();
    for (let i = 0; i < 3; i++) {
      await repo.create(makeRole({ id: `${batchId}-${i}`, name: `${batchId}-${i}` }));
    }

    const firstPage = await repo.list({ limit: 2 });
    expect(firstPage.items.length).toBeLessThanOrEqual(2);
  });
});

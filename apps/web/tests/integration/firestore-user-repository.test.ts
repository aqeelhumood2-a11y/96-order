import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { FirestoreUserRepository } from "@/infrastructure/firebase/repositories/firestore-user-repository";
import type { StaffUser } from "@/core/auth/entities";

const repo = new FirestoreUserRepository();

function makeUser(overrides: Partial<StaffUser> = {}): StaffUser {
  const uid = randomUUID();
  const now = new Date();
  return {
    uid,
    email: `${uid}@example.com`,
    status: "active",
    roleIds: [],
    directPermissions: [],
    createdAt: now,
    updatedAt: now,
    createdBy: "test-runner",
    ...overrides,
  };
}

describe("FirestoreUserRepository (emulator)", () => {
  it("creates and finds a user by uid and by email", async () => {
    const user = makeUser();
    await repo.create(user);

    const byUid = await repo.findByUid(user.uid);
    expect(byUid?.email).toBe(user.email);

    const byEmail = await repo.findByEmail(user.email);
    expect(byEmail?.uid).toBe(user.uid);
  });

  it("returns null for a uid that doesn't exist", async () => {
    expect(await repo.findByUid(randomUUID())).toBeNull();
  });

  it("sets status and revokes on deactivate is the caller's job, not the repository's", async () => {
    const user = makeUser();
    await repo.create(user);

    await repo.setStatus(user.uid, "deactivated", "actor-uid");
    const deactivated = await repo.findByUid(user.uid);
    expect(deactivated?.status).toBe("deactivated");
    expect(deactivated?.deactivatedBy).toBe("actor-uid");

    await repo.setStatus(user.uid, "active", "actor-uid");
    const reactivated = await repo.findByUid(user.uid);
    expect(reactivated?.status).toBe("active");
    expect(reactivated?.deactivatedAt).toBeUndefined();
  });

  it("assigns roles and direct permissions", async () => {
    const user = makeUser();
    await repo.create(user);

    await repo.assignRoles(user.uid, ["editor", "reviewer"]);
    await repo.setDirectPermissions(user.uid, ["dashboard:view"]);

    const updated = await repo.findByUid(user.uid);
    expect(updated?.roleIds).toEqual(["editor", "reviewer"]);
    expect(updated?.directPermissions).toEqual(["dashboard:view"]);
  });

  it("records a login timestamp", async () => {
    const user = makeUser();
    await repo.create(user);

    const loginAt = new Date();
    await repo.recordLogin(user.uid, loginAt);

    const updated = await repo.findByUid(user.uid);
    expect(updated?.lastLoginAt?.getTime()).toBe(loginAt.getTime());
  });

  it("paginates and filters by status", async () => {
    const batchId = randomUUID();
    const activeUsers = await Promise.all(
      Array.from({ length: 3 }, (_, i) => makeUser({ email: `${batchId}-active-${i}@example.com`, status: "active" })),
    );
    for (const user of activeUsers) {
      await repo.create(user);
    }
    const deactivatedUser = makeUser({ email: `${batchId}-deactivated@example.com`, status: "deactivated" });
    await repo.create(deactivatedUser);

    const firstPage = await repo.list({ limit: 2, status: "active" });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.items.every((item) => item.status === "active")).toBe(true);
    expect(firstPage.nextCursor).not.toBeNull();

    const secondPage = await repo.list({ limit: 2, status: "active", cursor: firstPage.nextCursor });
    expect(secondPage.items.length).toBeGreaterThanOrEqual(1);
  });
});

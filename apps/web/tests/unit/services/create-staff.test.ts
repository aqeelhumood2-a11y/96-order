import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/core/errors";
import { createStaff } from "@/services/auth/create-staff";
import { createMockDeps, makeSession } from "./test-helpers";

const ROLE = {
  id: "editor",
  name: "Editor",
  description: "",
  permissions: [],
  isSystemRole: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "x",
  updatedBy: "x",
};

describe("createStaff", () => {
  it("denies an actor without staff:create", async () => {
    const deps = createMockDeps();
    const actor = makeSession({ effectivePermissions: new Set() });

    await expect(createStaff(actor, { email: "new@example.com", roleIds: [] }, deps)).rejects.toThrow(ForbiddenError);
    expect(deps.authSession.createUser).not.toHaveBeenCalled();
  });

  it("rejects an email that already has a staff account", async () => {
    const deps = createMockDeps();
    deps.users.findByEmail = vi.fn().mockResolvedValue({ uid: "existing" });
    const actor = makeSession({ effectivePermissions: new Set(["staff:create"]) });

    await expect(createStaff(actor, { email: "new@example.com", roleIds: [] }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects an unknown role id", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(null);
    const actor = makeSession({ effectivePermissions: new Set(["staff:create"]) });

    await expect(createStaff(actor, { email: "new@example.com", roleIds: ["ghost-role"] }, deps)).rejects.toThrow(
      ValidationError,
    );
  });

  it("creates the auth user, the staff record, and triggers the password-setup email — never returning a link", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(ROLE);
    deps.authSession.createUser = vi.fn().mockResolvedValue({ uid: "new-uid", email: "new@example.com", disabled: false });
    const actor = makeSession({ effectivePermissions: new Set(["staff:create"]) });

    const result = await createStaff(actor, { email: "new@example.com", roleIds: ["editor"] }, deps);

    expect(result).toEqual({ uid: "new-uid" });
    expect(deps.authSession.sendPasswordResetEmail).toHaveBeenCalledWith("new@example.com");
    expect(deps.users.create).toHaveBeenCalledWith(expect.objectContaining({ uid: "new-uid", roleIds: ["editor"] }));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "staff_created", targetUid: "new-uid" }));
  });

  it("is satisfied by staff:manage too, via the namespace wildcard", async () => {
    const deps = createMockDeps();
    deps.authSession.createUser = vi.fn().mockResolvedValue({ uid: "new-uid", email: "new@example.com", disabled: false });
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await expect(createStaff(actor, { email: "new@example.com", roleIds: [] }, deps)).resolves.toBeDefined();
  });
});

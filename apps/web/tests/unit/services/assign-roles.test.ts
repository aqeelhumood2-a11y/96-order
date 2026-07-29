import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, ValidationError } from "@/core/errors";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { assignRoles } from "@/services/auth/assign-roles";
import { createMockDeps, makeSession } from "./test-helpers";

describe("assignRoles", () => {
  it("refuses to remove the super_admin role when the target is the last active super admin", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [SUPER_ADMIN_ROLE_ID] });
    deps.users.countActiveUsersWithRole = vi.fn().mockResolvedValue(1);
    const actor = makeSession({ roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set() });

    await expect(assignRoles(actor, "target", [], deps)).rejects.toThrow(ForbiddenError);
    expect(deps.users.assignRoles).not.toHaveBeenCalled();
  });

  it("allows removing super_admin from a target when another active super admin still exists", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [SUPER_ADMIN_ROLE_ID] });
    deps.users.countActiveUsersWithRole = vi.fn().mockResolvedValue(2);
    const actor = makeSession({ roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set() });

    await assignRoles(actor, "target", [], deps);
    expect(deps.users.assignRoles).toHaveBeenCalledWith("target", []);
  });

  it("allows keeping super_admin alongside other roles without even checking the last-admin count", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [SUPER_ADMIN_ROLE_ID] });
    deps.roles.findById = vi.fn().mockResolvedValue({ id: "extra" });
    const actor = makeSession({ roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set() });

    await assignRoles(actor, "target", [SUPER_ADMIN_ROLE_ID, "extra"], deps);
    expect(deps.users.assignRoles).toHaveBeenCalledWith("target", [SUPER_ADMIN_ROLE_ID, "extra"]);
    expect(deps.users.countActiveUsersWithRole).not.toHaveBeenCalled();
  });

  it("rejects an unknown role id", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [] });
    deps.roles.findById = vi.fn().mockResolvedValue(null);
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });

    await expect(assignRoles(actor, "target", ["ghost"], deps)).rejects.toThrow(ValidationError);
  });

  it("assigns roles and records staff_role_changed", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [] });
    deps.roles.findById = vi.fn().mockResolvedValue({ id: "editor" });
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });

    await assignRoles(actor, "target", ["editor"], deps);

    expect(deps.users.assignRoles).toHaveBeenCalledWith("target", ["editor"]);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "staff_role_changed" }));
  });
});

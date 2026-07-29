import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { setStaffStatus } from "@/services/auth/set-staff-status";
import { createMockDeps, makeSession } from "./test-helpers";

describe("setStaffStatus", () => {
  it("denies an actor without staff:edit", async () => {
    const deps = createMockDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(setStaffStatus(actor, "target", "deactivated", deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s when the target account doesn't exist", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue(null);
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });
    await expect(setStaffStatus(actor, "ghost", "deactivated", deps)).rejects.toThrow(NotFoundError);
  });

  it("refuses to deactivate a super admin, even for another super admin", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [SUPER_ADMIN_ROLE_ID] });
    const actor = makeSession({ roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set() });

    await expect(setStaffStatus(actor, "target", "deactivated", deps)).rejects.toThrow(ForbiddenError);
    expect(deps.users.setStatus).not.toHaveBeenCalled();
  });

  it("deactivates a regular staff account and revokes their sessions", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [] });
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });

    await setStaffStatus(actor, "target", "deactivated", deps);

    expect(deps.users.setStatus).toHaveBeenCalledWith("target", "deactivated", actor.uid);
    expect(deps.authSession.revokeRefreshTokens).toHaveBeenCalledWith("target");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "staff_deactivated" }));
  });

  it("activates without revoking sessions", async () => {
    const deps = createMockDeps();
    deps.users.findByUid = vi.fn().mockResolvedValue({ uid: "target", roleIds: [] });
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });

    await setStaffStatus(actor, "target", "active", deps);

    expect(deps.authSession.revokeRefreshTokens).not.toHaveBeenCalled();
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "staff_activated" }));
  });
});

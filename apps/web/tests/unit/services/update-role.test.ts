import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { updateRole } from "@/services/auth/update-role";
import { createMockDeps, makeSession } from "./test-helpers";

const SYSTEM_ROLE = {
  id: "super_admin",
  name: "Super Admin",
  description: "",
  permissions: [],
  isSystemRole: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "x",
  updatedBy: "x",
};

const CUSTOM_ROLE = { ...SYSTEM_ROLE, id: "editor", isSystemRole: false };

describe("updateRole", () => {
  it("denies an actor without staff:manage", async () => {
    const deps = createMockDeps();
    const actor = makeSession({ effectivePermissions: new Set(["staff:edit"]) });
    await expect(updateRole(actor, "editor", { name: "New name" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s for an unknown role", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(null);
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });
    await expect(updateRole(actor, "ghost", {}, deps)).rejects.toThrow(NotFoundError);
  });

  it("refuses to modify a system role even for a staff:manage holder", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(SYSTEM_ROLE);
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await expect(updateRole(actor, "super_admin", { permissions: [] }, deps)).rejects.toThrow(ForbiddenError);
    expect(deps.roles.update).not.toHaveBeenCalled();
  });

  it("rejects an unknown permission string", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(CUSTOM_ROLE);
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await expect(updateRole(actor, "editor", { permissions: ["not:real"] }, deps)).rejects.toThrow(ValidationError);
  });

  it("updates a custom role and records permissions_changed when permissions change", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(CUSTOM_ROLE);
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await updateRole(actor, "editor", { permissions: ["staff:view"] }, deps);

    expect(deps.roles.update).toHaveBeenCalledWith("editor", expect.objectContaining({ permissions: ["staff:view"] }));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "permissions_changed" }));
  });
});

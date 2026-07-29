import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { deleteRole } from "@/services/auth/delete-role";
import { createMockDeps, makeSession } from "./test-helpers";

describe("deleteRole", () => {
  it("denies an actor without staff:manage", async () => {
    const deps = createMockDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(deleteRole(actor, "editor", deps)).rejects.toThrow(ForbiddenError);
  });

  it("404s for an unknown role", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue(null);
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });
    await expect(deleteRole(actor, "ghost", deps)).rejects.toThrow(NotFoundError);
  });

  it("refuses to delete a system role", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue({ id: "super_admin", isSystemRole: true });
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await expect(deleteRole(actor, "super_admin", deps)).rejects.toThrow(ForbiddenError);
    expect(deps.roles.delete).not.toHaveBeenCalled();
  });

  it("deletes a custom role", async () => {
    const deps = createMockDeps();
    deps.roles.findById = vi.fn().mockResolvedValue({ id: "editor", isSystemRole: false });
    const actor = makeSession({ effectivePermissions: new Set(["staff:manage"]) });

    await deleteRole(actor, "editor", deps);
    expect(deps.roles.delete).toHaveBeenCalledWith("editor");
  });
});

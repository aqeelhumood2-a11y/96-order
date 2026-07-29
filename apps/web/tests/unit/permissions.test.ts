import { describe, expect, it } from "vitest";
import {
  allManagePermissions,
  formatPermission,
  hasPermission,
  isPermission,
  isSuperAdmin,
  resolveEffectivePermissions,
  SUPER_ADMIN_ROLE_ID,
  type Permission,
} from "@/core/auth/permissions";

describe("hasPermission", () => {
  it("grants a super admin every permission unconditionally", () => {
    const principal = { roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set<Permission>() };
    expect(hasPermission(principal, "staff:manage")).toBe(true);
    expect(hasPermission(principal, "payments:delete")).toBe(true);
  });

  it("grants an exact permission match", () => {
    const principal = { roleIds: ["editor"], effectivePermissions: new Set<Permission>(["products:view"]) };
    expect(hasPermission(principal, "products:view")).toBe(true);
  });

  it("grants any action in a namespace when the namespace's manage permission is held", () => {
    const principal = { roleIds: ["ops"], effectivePermissions: new Set<Permission>(["staff:manage"]) };
    expect(hasPermission(principal, "staff:view")).toBe(true);
    expect(hasPermission(principal, "staff:delete")).toBe(true);
  });

  it("denies a permission that isn't held and isn't covered by a manage wildcard", () => {
    const principal = { roleIds: ["viewer"], effectivePermissions: new Set<Permission>(["products:view"]) };
    expect(hasPermission(principal, "products:delete")).toBe(false);
    expect(hasPermission(principal, "orders:view")).toBe(false);
  });

  it("denies everything for a principal with no roles or permissions", () => {
    const principal = { roleIds: [], effectivePermissions: new Set<Permission>() };
    expect(hasPermission(principal, "dashboard:view")).toBe(false);
  });
});

describe("isSuperAdmin", () => {
  it("is true only when roleIds includes the reserved super_admin id", () => {
    expect(isSuperAdmin({ roleIds: [SUPER_ADMIN_ROLE_ID] })).toBe(true);
    expect(isSuperAdmin({ roleIds: ["super_admin_impersonator"] })).toBe(false);
    expect(isSuperAdmin({ roleIds: [] })).toBe(false);
  });
});

describe("resolveEffectivePermissions", () => {
  it("unions role permissions and direct permissions", () => {
    const roles = [
      { id: "role-a", permissions: ["staff:view" as Permission] },
      { id: "role-b", permissions: ["staff:create" as Permission] },
    ];
    const result = resolveEffectivePermissions(["role-a", "role-b"], ["dashboard:view"], roles);
    expect(result).toEqual(new Set(["dashboard:view", "staff:view", "staff:create"]));
  });

  it("ignores role ids that don't resolve to a known role", () => {
    const result = resolveEffectivePermissions(["missing-role"], [], []);
    expect(result.size).toBe(0);
  });
});

describe("isPermission", () => {
  it("accepts a known namespace:action pair", () => {
    expect(isPermission("staff:manage")).toBe(true);
  });

  it("rejects an unknown namespace or action", () => {
    expect(isPermission("not-a-namespace:view")).toBe(false);
    expect(isPermission("staff:not-an-action")).toBe(false);
    expect(isPermission("staff")).toBe(false);
  });
});

describe("allManagePermissions", () => {
  it("returns exactly one manage permission per namespace", () => {
    const permissions = allManagePermissions();
    expect(permissions).toContain(formatPermission("staff", "manage"));
    expect(permissions).toContain(formatPermission("audit_logs", "manage"));
    expect(new Set(permissions).size).toBe(permissions.length);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import { ForbiddenError, UnauthorizedError } from "@/core/errors";
import { getSession, requirePermission, requireSession } from "@/services/auth/session";
import { createMockDeps, makeSession } from "./test-helpers";

describe("getSession", () => {
  beforeEach(() => {
    mockCookieStore.get.mockReset();
  });

  it("returns null when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const deps = createMockDeps();

    expect(await getSession(deps)).toBeNull();
    expect(deps.authSession.verifySessionCookie).not.toHaveBeenCalled();
  });

  it("returns null when the cookie fails verification (invalid, expired, or revoked)", async () => {
    mockCookieStore.get.mockReturnValue({ value: "bad-cookie" });
    const deps = createMockDeps();
    deps.authSession.verifySessionCookie = vi.fn().mockResolvedValue(null);

    expect(await getSession(deps)).toBeNull();
  });

  it("returns null when the staff record is missing", async () => {
    mockCookieStore.get.mockReturnValue({ value: "cookie" });
    const deps = createMockDeps();
    deps.authSession.verifySessionCookie = vi.fn().mockResolvedValue({ uid: "u1", email: "u1@example.com" });
    deps.users.findByUid = vi.fn().mockResolvedValue(null);

    expect(await getSession(deps)).toBeNull();
  });

  it("returns null for a deactivated staff account, even with a validly-verified cookie", async () => {
    mockCookieStore.get.mockReturnValue({ value: "cookie" });
    const deps = createMockDeps();
    deps.authSession.verifySessionCookie = vi.fn().mockResolvedValue({ uid: "u1", email: "u1@example.com" });
    deps.users.findByUid = vi.fn().mockResolvedValue({
      uid: "u1",
      email: "u1@example.com",
      status: "deactivated",
      roleIds: [],
      directPermissions: [],
    });

    expect(await getSession(deps)).toBeNull();
  });

  it("resolves effective permissions from the user's roles and direct grants", async () => {
    mockCookieStore.get.mockReturnValue({ value: "cookie" });
    const deps = createMockDeps();
    deps.authSession.verifySessionCookie = vi.fn().mockResolvedValue({ uid: "u1", email: "u1@example.com" });
    deps.users.findByUid = vi.fn().mockResolvedValue({
      uid: "u1",
      email: "u1@example.com",
      status: "active",
      roleIds: ["editor"],
      directPermissions: ["dashboard:view"],
    });
    deps.roles.findById = vi.fn().mockResolvedValue({ id: "editor", permissions: ["staff:view"] });

    const session = await getSession(deps);

    expect(session).not.toBeNull();
    expect(session!.effectivePermissions.has("staff:view")).toBe(true);
    expect(session!.effectivePermissions.has("dashboard:view")).toBe(true);
  });
});

describe("requireSession", () => {
  it("throws UnauthorizedError when there is no session", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const deps = createMockDeps();

    await expect(requireSession(deps)).rejects.toThrow(UnauthorizedError);
  });
});

describe("requirePermission", () => {
  it("throws ForbiddenError when the session lacks the permission", () => {
    const session = makeSession({ effectivePermissions: new Set() });
    expect(() => requirePermission(session, "staff:view")).toThrow(ForbiddenError);
  });

  it("does not throw when the session has the permission", () => {
    const session = makeSession({ effectivePermissions: new Set(["staff:view"]) });
    expect(() => requirePermission(session, "staff:view")).not.toThrow();
  });
});

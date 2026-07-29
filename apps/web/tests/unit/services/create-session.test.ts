import { describe, expect, it, vi } from "vitest";
import { RateLimitedError, ForbiddenError } from "@/core/errors";
import { createSession } from "@/services/auth/create-session";
import { createMockDeps } from "./test-helpers";

const VERIFIED = { uid: "user-1", email: "user@example.com" };

describe("createSession", () => {
  it("rejects when the IP rate limit is exceeded, without verifying the token", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    await expect(createSession({ idToken: "token", ip: "1.2.3.4" }, deps)).rejects.toThrow(RateLimitedError);
    expect(deps.authSession.verifyIdToken).not.toHaveBeenCalled();
  });

  it("rejects when the per-email rate limit is exceeded after the IP check passes", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.rateLimiter.consume = vi
      .fn()
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 10 });

    await expect(createSession({ idToken: "token", ip: "1.2.3.4" }, deps)).rejects.toThrow(RateLimitedError);
  });

  it("denies and audit-logs a login_failure when the token is valid but the account isn't staff", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue(null);

    await expect(createSession({ idToken: "token", ip: "1.2.3.4" }, deps)).rejects.toThrow(ForbiddenError);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "login_failure", metadata: { reason: "not_staff" } }),
    );
  });

  it("denies a deactivated staff account", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue({
      uid: "user-1",
      email: "user@example.com",
      status: "deactivated",
      roleIds: [],
      directPermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "someone",
    });

    await expect(createSession({ idToken: "token", ip: "1.2.3.4" }, deps)).rejects.toThrow(ForbiddenError);
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "login_failure", metadata: { reason: "deactivated" } }),
    );
  });

  it("mints a session cookie, records the login, and audit-logs login_success for an active staff account", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue({
      uid: "user-1",
      email: "user@example.com",
      status: "active",
      roleIds: [],
      directPermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "someone",
    });

    const result = await createSession({ idToken: "token", ip: "1.2.3.4" }, deps);

    expect(result.cookie).toBe("session-cookie");
    expect(deps.users.recordLogin).toHaveBeenCalledWith("user-1", expect.any(Date));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "login_success" }));
  });
});

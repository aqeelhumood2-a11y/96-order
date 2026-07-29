import { describe, expect, it, vi } from "vitest";
import { RateLimitedError, UnauthorizedError } from "@/core/errors";
import { createSession } from "@/services/auth/create-session";
import { createMockDeps } from "./test-helpers";

const VERIFIED = { uid: "user-1", email: "user@example.com" };
const ACTIVE_STAFF = {
  uid: "user-1",
  email: "user@example.com",
  status: "active" as const,
  roleIds: [],
  directPermissions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "someone",
};

describe("createSession", () => {
  it("rejects when the IP rate limit is exceeded, before any password verification is attempted", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 42 });

    await expect(createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps)).rejects.toThrow(
      RateLimitedError,
    );
    expect(deps.authSession.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejects when the per-email rate limit is exceeded, before any password verification is attempted", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi
      .fn()
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 10 });

    await expect(createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps)).rejects.toThrow(
      RateLimitedError,
    );
    expect(deps.authSession.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rate-limits by a normalized (trimmed, lowercased) email so casing/whitespace can't dodge the limiter", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue(ACTIVE_STAFF);

    await createSession({ email: "  User@Example.com  ", password: "pw", ip: "1.2.3.4" }, deps);

    expect(deps.rateLimiter.consume).toHaveBeenCalledWith(
      "session-create:email:user@example.com",
      expect.any(Number),
      expect.any(Number),
    );
    expect(deps.authSession.signInWithPassword).toHaveBeenCalledWith("user@example.com", "pw");
  });

  it("denies wrong credentials with the same generic error the not-staff case uses", async () => {
    const deps = createMockDeps();
    deps.authSession.signInWithPassword = vi.fn().mockRejectedValue(new UnauthorizedError("Invalid email or password."));

    await expect(createSession({ email: "user@example.com", password: "wrong", ip: "1.2.3.4" }, deps)).rejects.toThrow(
      UnauthorizedError,
    );
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "login_failure", actorUid: null, metadata: { reason: "invalid_credentials" } }),
    );
  });

  it("propagates RateLimitedError from Firebase's own abuse protection surfaced through the port", async () => {
    const deps = createMockDeps();
    deps.authSession.signInWithPassword = vi.fn().mockRejectedValue(new RateLimitedError("Too many sign-in attempts."));

    await expect(createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps)).rejects.toThrow(
      RateLimitedError,
    );
  });

  it("denies and audit-logs a login_failure when credentials are valid but the account isn't staff — same error as wrong credentials", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue(null);

    const promise = createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps);
    await expect(promise).rejects.toThrow(UnauthorizedError);
    await expect(promise).rejects.toThrow("Invalid email or password.");
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "login_failure", metadata: { reason: "not_staff" } }),
    );
  });

  it("denies a deactivated staff account with the same generic error", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue({ ...ACTIVE_STAFF, status: "deactivated" });

    await expect(createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps)).rejects.toThrow(
      UnauthorizedError,
    );
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "login_failure", metadata: { reason: "deactivated" } }),
    );
  });

  it("mints a session cookie, records the login, and audit-logs login_success for an active staff account", async () => {
    const deps = createMockDeps();
    deps.authSession.verifyIdToken = vi.fn().mockResolvedValue(VERIFIED);
    deps.users.findByUid = vi.fn().mockResolvedValue(ACTIVE_STAFF);

    const result = await createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps);

    expect(result.cookie).toBe("session-cookie");
    expect(deps.users.recordLogin).toHaveBeenCalledWith("user-1", expect.any(Date));
    expect(deps.auditLogs.record).toHaveBeenCalledWith(expect.objectContaining({ type: "login_success" }));
  });

  it("pads the response to the configured minimum duration even on a fast rejection", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 1 });

    const startedAt = Date.now();
    await expect(createSession({ email: "user@example.com", password: "pw", ip: "1.2.3.4" }, deps)).rejects.toThrow();
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(290); // MINIMUM_LOGIN_RESPONSE_MS with a small tolerance
  });
});

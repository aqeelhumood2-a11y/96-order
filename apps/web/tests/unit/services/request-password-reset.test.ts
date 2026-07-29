import { describe, expect, it, vi } from "vitest";
import { RateLimitedError } from "@/core/errors";
import { requestPasswordReset } from "@/services/auth/request-password-reset";
import { createMockDeps } from "./test-helpers";

describe("requestPasswordReset", () => {
  it("rejects when the IP rate limit is exceeded", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 5 });

    await expect(requestPasswordReset({ email: "a@example.com", ip: "1.2.3.4" }, deps)).rejects.toThrow(RateLimitedError);
  });

  it("rejects when the per-email rate limit is exceeded", async () => {
    const deps = createMockDeps();
    deps.rateLimiter.consume = vi
      .fn()
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 5 });

    await expect(requestPasswordReset({ email: "a@example.com", ip: "1.2.3.4" }, deps)).rejects.toThrow(RateLimitedError);
  });

  it("succeeds and audit-logs without ever looking up whether the account exists", async () => {
    const deps = createMockDeps();

    await requestPasswordReset({ email: "a@example.com", ip: "1.2.3.4" }, deps);

    expect(deps.users.findByEmail).not.toHaveBeenCalled();
    expect(deps.authSession.getUserByEmail).not.toHaveBeenCalled();
    expect(deps.auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: "password_reset_requested", actorEmail: "a@example.com" }),
    );
  });
});

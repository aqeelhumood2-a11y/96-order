import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyJobSecret } from "@/lib/verify-job-secret";

function makeRequest(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://example.com/api/jobs/retry-failed-emails", { headers });
}

describe("verifyJobSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies every request when JOB_SECRET isn't configured", () => {
    vi.stubEnv("JOB_SECRET", "");
    expect(verifyJobSecret(makeRequest("Bearer anything"))).toBe(false);
  });

  it("denies a request with no Authorization header", () => {
    vi.stubEnv("JOB_SECRET", "super-secret");
    expect(verifyJobSecret(makeRequest())).toBe(false);
  });

  it("denies a request with the wrong secret", () => {
    vi.stubEnv("JOB_SECRET", "super-secret");
    expect(verifyJobSecret(makeRequest("Bearer wrong-secret"))).toBe(false);
  });

  it("allows a request with the exact configured secret", () => {
    vi.stubEnv("JOB_SECRET", "super-secret");
    expect(verifyJobSecret(makeRequest("Bearer super-secret"))).toBe(true);
  });
});

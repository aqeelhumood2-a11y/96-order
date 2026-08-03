import { afterEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { getIntegrationStatus } from "@/services/integrations/get-integration-status";
import { makeSession } from "../test-helpers";

describe("getIntegrationStatus", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies an actor without integrations:view", () => {
    const actor = makeSession({ effectivePermissions: new Set() });
    expect(() => getIntegrationStatus(actor)).toThrow(ForbiddenError);
  });

  it("reports presence, never the value, of each optional credential", () => {
    vi.stubEnv("JOB_SECRET", "some-secret");
    vi.stubEnv("TAP_SECRET_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const actor = makeSession({ effectivePermissions: new Set(["integrations:view"]) });

    const status = getIntegrationStatus(actor);
    expect(status.jobSecretConfigured).toBe(true);
    expect(status.tapConfigured).toBe(false);
    expect(status.anthropicConfigured).toBe(false);
  });
});

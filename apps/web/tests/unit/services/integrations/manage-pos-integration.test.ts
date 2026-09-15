import { describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import type { PosIntegrationSettings } from "@/core/integrations/entities";
import type { IntegrationsDeps } from "@/services/integrations/dependencies";
import { getPosIntegrationForAdmin, updatePosIntegration } from "@/services/integrations/manage-pos-integration";
import { makeSession } from "../test-helpers";

function makeDeps(overrides: Partial<IntegrationsDeps> = {}): IntegrationsDeps {
  return {
    posIntegration: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    },
    auditLogs: {
      record: vi.fn().mockResolvedValue({}),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    },
    ...overrides,
  };
}

function makeSettings(overrides: Partial<PosIntegrationSettings> = {}): PosIntegrationSettings {
  return { webhookUrl: "https://pos.example.com/webhook", apiKey: "existing-key", updatedAt: new Date(), updatedBy: "someone", ...overrides };
}

describe("getPosIntegrationForAdmin", () => {
  it("denies an actor without integrations:view", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(getPosIntegrationForAdmin(actor, deps)).rejects.toThrow(ForbiddenError);
  });

  it("returns empty defaults before anything has ever been saved", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["integrations:view"]) });
    const result = await getPosIntegrationForAdmin(actor, deps);
    expect(result.webhookUrl).toBe("");
    expect(result.apiKey).toBe("");
  });

  it("returns the stored settings, including the real API key", async () => {
    const deps = makeDeps({ posIntegration: { get: vi.fn().mockResolvedValue(makeSettings()), set: vi.fn() } });
    const actor = makeSession({ effectivePermissions: new Set(["integrations:view"]) });
    const result = await getPosIntegrationForAdmin(actor, deps);
    expect(result.webhookUrl).toBe("https://pos.example.com/webhook");
    expect(result.apiKey).toBe("existing-key");
  });
});

describe("updatePosIntegration", () => {
  it("denies an actor without integrations:manage", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["integrations:view"]) });
    await expect(updatePosIntegration(actor, { webhookUrl: "", apiKey: "" }, deps)).rejects.toThrow(ForbiddenError);
  });

  it("saves a new webhook URL and API key", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["integrations:manage"]) });

    await updatePosIntegration(actor, { webhookUrl: "https://pos.example.com/hook", apiKey: "new-key" }, deps);

    expect(deps.posIntegration.set).toHaveBeenCalledWith(
      expect.objectContaining({ webhookUrl: "https://pos.example.com/hook", apiKey: "new-key" }),
    );
  });

  it("keeps the existing API key when the submitted key is blank", async () => {
    const deps = makeDeps({ posIntegration: { get: vi.fn().mockResolvedValue(makeSettings({ apiKey: "already-set" })), set: vi.fn() } });
    const actor = makeSession({ effectivePermissions: new Set(["integrations:manage"]) });

    await updatePosIntegration(actor, { webhookUrl: "https://pos.example.com/new-hook", apiKey: "" }, deps);

    expect(deps.posIntegration.set).toHaveBeenCalledWith(
      expect.objectContaining({ webhookUrl: "https://pos.example.com/new-hook", apiKey: "already-set" }),
    );
  });

  it("never puts the API key value in the audit log", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["integrations:manage"]) });

    await updatePosIntegration(actor, { webhookUrl: "https://pos.example.com/hook", apiKey: "super-secret" }, deps);

    expect(deps.auditLogs.record).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        type: "pos_integration_updated",
        metadata: { webhookConfigured: true, apiKeyConfigured: true },
      }),
    );
    const [entry] = (deps.auditLogs.record as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(JSON.stringify(entry)).not.toContain("super-secret");
  });
});

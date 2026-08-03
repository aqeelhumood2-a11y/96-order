import { describe, expect, it, vi } from "vitest";
import { ForbiddenError, RateLimitedError, ValidationError } from "@/core/errors";
import type { AIAssistantDeps } from "@/services/ai-assistant/dependencies";
import { askAdminAssistant } from "@/services/ai-assistant/ask-assistant";
import { makeSession } from "../test-helpers";

function makeDeps(overrides: Partial<AIAssistantDeps> = {}): AIAssistantDeps {
  return {
    assistant: { answer: vi.fn().mockResolvedValue({ text: "AI answer", generatedByAI: true }) },
    fallbackAssistant: { answer: vi.fn().mockResolvedValue({ text: "Fallback digest", generatedByAI: false }) },
    reports: {
      reports: {
        getDashboardCounts: vi.fn().mockResolvedValue({ totalOrders: 0, totalRevenue: { amount: 0, currency: "BHD" }, ordersByStatus: {} }),
        listOrdersForReport: vi.fn().mockResolvedValue([]),
        listOrderLinesForReport: vi.fn().mockResolvedValue([]),
      },
    },
    orders: {
      orders: {
        findById: vi.fn(),
        findByOrderNumber: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
        listByCustomer: vi.fn(),
      },
    },
    rateLimiter: { consume: vi.fn().mockResolvedValue({ allowed: true }) },
    ...overrides,
  };
}

describe("askAdminAssistant", () => {
  it("denies an actor without reports:view", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set() });
    await expect(askAdminAssistant(actor, "How's business?", deps)).rejects.toThrow(ForbiddenError);
  });

  it("rejects an empty or whitespace-only question", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });
    await expect(askAdminAssistant(actor, "   ", deps)).rejects.toThrow(ValidationError);
  });

  it("rejects a question over the configured length limit", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });
    await expect(askAdminAssistant(actor, "a".repeat(600), deps)).rejects.toThrow(ValidationError);
  });

  it("rejects when the per-admin rate limit is exhausted", async () => {
    const deps = makeDeps({ rateLimiter: { consume: vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 60 }) } });
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });
    await expect(askAdminAssistant(actor, "How's business?", deps)).rejects.toThrow(RateLimitedError);
  });

  it("returns the primary provider's answer when it succeeds", async () => {
    const deps = makeDeps();
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });
    const result = await askAdminAssistant(actor, "How's business?", deps);
    expect(result).toEqual({ answer: "AI answer", generatedByAI: true });
    expect(deps.fallbackAssistant.answer).not.toHaveBeenCalled();
  });

  it("falls back to the deterministic digest when the primary provider throws", async () => {
    const deps = makeDeps({ assistant: { answer: vi.fn().mockRejectedValue(new Error("upstream down")) } });
    const actor = makeSession({ effectivePermissions: new Set(["reports:view"]) });
    const result = await askAdminAssistant(actor, "How's business?", deps);
    expect(result).toEqual({ answer: "Fallback digest", generatedByAI: false });
  });
});

import { describe, expect, it, vi } from "vitest";
import type { EmailDeps } from "@/services/email/dependencies";
import { retryFailedEmails } from "@/services/email/retry-failed-emails";

function makeEntry(overrides: Partial<{ id: string; to: string }> = {}) {
  return {
    id: overrides.id ?? "outbox-1",
    to: overrides.to ?? "shopper@example.com",
    template: "order_confirmation" as const,
    data: {},
    status: "failed" as const,
    attempts: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("retryFailedEmails", () => {
  it("does nothing when there's nothing retryable", async () => {
    const deps: EmailDeps = {
      email: { send: vi.fn() },
      outbox: { enqueue: vi.fn(), markSent: vi.fn(), markFailed: vi.fn(), listRetryable: vi.fn().mockResolvedValue([]) },
    };
    const result = await retryFailedEmails(deps);
    expect(result).toEqual({ attempted: 0, succeeded: 0, stillFailing: 0 });
    expect(deps.email.send).not.toHaveBeenCalled();
  });

  it("marks a successful retry sent and a still-failing retry failed again", async () => {
    const entries = [makeEntry({ id: "outbox-1" }), makeEntry({ id: "outbox-2" })];
    const deps: EmailDeps = {
      email: {
        send: vi
          .fn()
          .mockResolvedValueOnce({ sent: true })
          .mockResolvedValueOnce({ sent: false, error: "still down" }),
      },
      outbox: { enqueue: vi.fn(), markSent: vi.fn().mockResolvedValue(undefined), markFailed: vi.fn().mockResolvedValue(undefined), listRetryable: vi.fn().mockResolvedValue(entries) },
    };

    const result = await retryFailedEmails(deps);

    expect(result).toEqual({ attempted: 2, succeeded: 1, stillFailing: 1 });
    expect(deps.outbox.markSent).toHaveBeenCalledWith("outbox-1");
    expect(deps.outbox.markFailed).toHaveBeenCalledWith("outbox-2", "still down");
  });
});

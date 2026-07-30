import { describe, expect, it, vi } from "vitest";
import type { EmailDeps } from "@/services/email/dependencies";
import { sendTransactionalEmail } from "@/services/email/send-transactional-email";

function createMockDeps(): EmailDeps {
  return {
    email: { send: vi.fn().mockResolvedValue({ sent: true }) },
    outbox: {
      enqueue: vi.fn().mockResolvedValue({
        id: "outbox-1",
        to: "shopper@example.com",
        template: "order_confirmation",
        data: {},
        status: "pending",
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      markSent: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("sendTransactionalEmail", () => {
  it("enqueues before sending, and marks the entry sent on success", async () => {
    const deps = createMockDeps();
    await sendTransactionalEmail({ to: "shopper@example.com", template: "order_confirmation", data: {} }, deps);

    expect(deps.outbox.enqueue).toHaveBeenCalledWith({ to: "shopper@example.com", template: "order_confirmation", data: {} });
    expect(deps.outbox.markSent).toHaveBeenCalledWith("outbox-1");
    expect(deps.outbox.markFailed).not.toHaveBeenCalled();
  });

  it("marks the entry failed, without throwing, when delivery fails", async () => {
    const deps = createMockDeps();
    deps.email.send = vi.fn().mockResolvedValue({ sent: false, error: "ESP unreachable" });

    await expect(
      sendTransactionalEmail({ to: "shopper@example.com", template: "order_confirmation", data: {} }, deps),
    ).resolves.toBeUndefined();

    expect(deps.outbox.markFailed).toHaveBeenCalledWith("outbox-1", "ESP unreachable");
  });
});

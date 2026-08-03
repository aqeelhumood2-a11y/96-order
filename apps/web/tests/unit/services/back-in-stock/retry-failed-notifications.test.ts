import { describe, expect, it, vi } from "vitest";
import type { BackInStockDeps } from "@/services/back-in-stock/dependencies";
import { retryFailedNotifications } from "@/services/back-in-stock/retry-failed-notifications";

function makeEntry(overrides: Partial<{ id: string; email: string; productId: string; subscriptionId: string }> = {}) {
  return {
    id: overrides.id ?? "notif-1",
    type: "back_in_stock" as const,
    subscriptionId: overrides.subscriptionId ?? "sub-1",
    email: overrides.email ?? "shopper@example.com",
    productId: overrides.productId ?? "product-1",
    variantId: null,
    status: "failed" as const,
    attempts: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeDeps(overrides: Partial<BackInStockDeps> = {}): BackInStockDeps {
  return {
    subscriptions: {
      findById: vi.fn().mockResolvedValue({
        id: "sub-1",
        customerUid: null,
        email: "shopper@example.com",
        productId: "product-1",
        variantId: null,
        status: "pending",
        unsubscribeToken: "token-1",
        createdAt: new Date(),
        notifiedAt: null,
      }),
      listByCustomer: vi.fn(),
      listPendingByProduct: vi.fn(),
      subscribe: vi.fn(),
      markNotified: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn(),
    },
    notificationOutbox: {
      enqueue: vi.fn(),
      markSent: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      list: vi.fn(),
      listRetryable: vi.fn().mockResolvedValue([]),
    },
    products: {
      list: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: "product-1", slug: "ethiopia-yirgacheffe", name: "Ethiopia Yirgacheffe" }),
      listFeatured: vi.fn(),
      listNewArrivals: vi.fn(),
      countByCategory: vi.fn(),
    },
    accounts: { findByUid: vi.fn(), create: vi.fn(), update: vi.fn() },
    email: { send: vi.fn().mockResolvedValue({ sent: true }) },
    rateLimiter: { consume: vi.fn() },
    auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    ...overrides,
  } as BackInStockDeps;
}

describe("retryFailedNotifications", () => {
  it("does nothing when there's nothing retryable", async () => {
    const deps = makeDeps();
    const result = await retryFailedNotifications(deps);
    expect(result).toEqual({ attempted: 0, succeeded: 0, stillFailing: 0 });
    expect(deps.email.send).not.toHaveBeenCalled();
  });

  it("re-sends by re-fetching the product/subscription, marks sent, and marks the subscription notified", async () => {
    const deps = makeDeps();
    deps.notificationOutbox.listRetryable = vi.fn().mockResolvedValue([makeEntry()]);

    const result = await retryFailedNotifications(deps);

    expect(result).toEqual({ attempted: 1, succeeded: 1, stillFailing: 0 });
    expect(deps.email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "shopper@example.com", template: "back_in_stock", data: expect.objectContaining({ productName: "Ethiopia Yirgacheffe" }) }),
    );
    expect(deps.notificationOutbox.markSent).toHaveBeenCalledWith("notif-1");
    expect(deps.subscriptions.markNotified).toHaveBeenCalledWith("sub-1");
  });

  it("marks permanently failed (no send attempt) when the product no longer exists", async () => {
    const deps = makeDeps({ products: { list: vi.fn(), findBySlug: vi.fn(), findById: vi.fn().mockResolvedValue(null), listFeatured: vi.fn(), listNewArrivals: vi.fn(), countByCategory: vi.fn() } as never });
    deps.notificationOutbox.listRetryable = vi.fn().mockResolvedValue([makeEntry()]);

    const result = await retryFailedNotifications(deps);

    expect(result).toEqual({ attempted: 1, succeeded: 0, stillFailing: 1 });
    expect(deps.email.send).not.toHaveBeenCalled();
    expect(deps.notificationOutbox.markFailed).toHaveBeenCalledWith("notif-1", "Product or subscription no longer exists.");
  });

  it("marks failed again when delivery still fails", async () => {
    const deps = makeDeps({ email: { send: vi.fn().mockResolvedValue({ sent: false, error: "still down" }) } });
    deps.notificationOutbox.listRetryable = vi.fn().mockResolvedValue([makeEntry()]);

    const result = await retryFailedNotifications(deps);

    expect(result).toEqual({ attempted: 1, succeeded: 0, stillFailing: 1 });
    expect(deps.notificationOutbox.markFailed).toHaveBeenCalledWith("notif-1", "still down");
  });
});

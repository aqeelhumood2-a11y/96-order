import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import type { OrderTrackingDeps } from "@/services/orders/dependencies";
import { trackOrder } from "@/services/orders/track-order";

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: "internal-id",
    orderNumber: "ORD-260130-ABCDEF",
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main Roastery", locationAddress: "Manama" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [],
    subtotal: { amount: 0, currency: "BHD" },
    shippingFee: { amount: 0, currency: "BHD" },
    discountTotal: { amount: 0, currency: "BHD" },
    grandTotal: { amount: 0, currency: "BHD" },
    currency: "BHD",
    paymentMethod: "cash",
    paymentStatus: "cash_pending",
    status: "confirmed",
    source: "web",
    idempotencyKey: "idem-1",
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createMockDeps(order: Order | null = makeOrder()): OrderTrackingDeps {
  return {
    orders: {
      findById: vi.fn(),
      findByOrderNumber: vi.fn().mockResolvedValue(order),
      findByIdempotencyKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      listByCustomer: vi.fn(),
    },
  };
}

describe("trackOrder", () => {
  it("returns the public view when the mobile number matches", async () => {
    const deps = createMockDeps();
    const view = await trackOrder({ orderNumber: "ORD-260130-ABCDEF", mobile: "36001234" }, deps);
    expect(view.orderNumber).toBe("ORD-260130-ABCDEF");
  });

  it("returns the public view when the email matches", async () => {
    const deps = createMockDeps();
    const view = await trackOrder({ orderNumber: "ORD-260130-ABCDEF", email: "Ahmed@Example.com" }, deps);
    expect(view.orderNumber).toBe("ORD-260130-ABCDEF");
  });

  it("requires at least one verification factor", async () => {
    const deps = createMockDeps();
    await expect(trackOrder({ orderNumber: "ORD-260130-ABCDEF" }, deps)).rejects.toThrow(ValidationError);
  });

  it("rejects a malformed order number with the same generic not-found error", async () => {
    const deps = createMockDeps();
    await expect(trackOrder({ orderNumber: "not-a-real-format", mobile: "36001234" }, deps)).rejects.toThrow(NotFoundError);
    expect(deps.orders.findByOrderNumber).not.toHaveBeenCalled();
  });

  it("rejects an order number that doesn't exist with the same generic error", async () => {
    const deps = createMockDeps(null);
    await expect(trackOrder({ orderNumber: "ORD-260130-ABCDEF", mobile: "36001234" }, deps)).rejects.toThrow(NotFoundError);
  });

  it("rejects a real order number with a mismatched verification factor, with the same generic error", async () => {
    const deps = createMockDeps();
    await expect(trackOrder({ orderNumber: "ORD-260130-ABCDEF", mobile: "39009999" }, deps)).rejects.toThrow(NotFoundError);
  });

  it("never distinguishes 'no such order' from 'wrong verification factor' in the thrown message", async () => {
    const notFoundDeps = createMockDeps(null);
    const mismatchDeps = createMockDeps();

    const notFoundError = await trackOrder({ orderNumber: "ORD-260130-ABCDEF", mobile: "36001234" }, notFoundDeps).catch((e) => e);
    const mismatchError = await trackOrder({ orderNumber: "ORD-260130-ABCDEF", mobile: "39009999" }, mismatchDeps).catch((e) => e);

    expect(notFoundError.message).toBe(mismatchError.message);
  });
});

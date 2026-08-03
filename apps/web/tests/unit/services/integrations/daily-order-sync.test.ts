import { describe, expect, it, vi } from "vitest";
import { money } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import type { OrderTrackingDeps } from "@/services/orders/dependencies";
import { getOrderSyncFeed } from "@/services/integrations/daily-order-sync";

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-01T10:00:00Z");
  return {
    id: "order-1",
    orderNumber: "ORD-260801-ABCDEF",
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-05", timeWindow: "10:00-12:00" } },
    lines: [{ productId: "p1", variantId: null, productName: "Ethiopia Yirgacheffe", sku: "ETH-1", imageUrl: null, unitPrice: money(1899), quantity: 2, lineTotal: money(3798) }],
    subtotal: money(3798),
    shippingFee: money(2000),
    discountTotal: money(0),
    grandTotal: money(5798),
    currency: "BHD",
    paymentMethod: "cash",
    paymentStatus: "cash_pending",
    status: "confirmed",
    source: "web",
    idempotencyKey: "idem-1",
    customerId: "ahmed@example.com",
    searchTokens: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("getOrderSyncFeed", () => {
  it("queries the date range oldest-first and maps orders to the stable sync shape", async () => {
    const deps: OrderTrackingDeps = {
      orders: {
        findById: vi.fn(),
        findByOrderNumber: vi.fn(),
        findByIdempotencyKey: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn().mockResolvedValue({ items: [makeOrder()], nextCursor: null }),
        listByCustomer: vi.fn(),
      },
    };

    const from = new Date("2026-08-01T00:00:00Z");
    const to = new Date("2026-08-02T00:00:00Z");
    const feed = await getOrderSyncFeed(from, to, deps);

    expect(deps.orders.list).toHaveBeenCalledWith(expect.objectContaining({ dateFrom: from, dateTo: to, sort: "createdAt", direction: "asc" }));
    expect(feed.count).toBe(1);
    expect(feed.orders[0]).toMatchObject({
      orderId: "order-1",
      orderNumber: "ORD-260801-ABCDEF",
      fulfillmentMethod: "pickup",
      customer: { fullName: "Ahmed Ali", email: "ahmed@example.com" },
    });
    expect(feed.orders[0]!.lines).toHaveLength(1);
  });
});

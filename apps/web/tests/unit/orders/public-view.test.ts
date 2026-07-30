import { describe, expect, it } from "vitest";
import type { Order } from "@/core/orders/entities";
import { buildPublicOrderView, publicPaymentStatusLabel } from "@/core/orders/public-view";

function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: "internal-id",
    orderNumber: "ORD-260130-ABCDEF",
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com", note: "leave at the door" },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main Roastery", locationAddress: "Manama" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [{ productId: "p1", variantId: null, productName: "Ethiopia Yirgacheffe", sku: "ETH-1", imageUrl: null, unitPrice: { amount: 1899, currency: "BHD" }, quantity: 2, lineTotal: { amount: 3798, currency: "BHD" } }],
    subtotal: { amount: 3798, currency: "BHD" },
    shippingFee: { amount: 2000, currency: "BHD" },
    discountTotal: { amount: 0, currency: "BHD" },
    grandTotal: { amount: 5798, currency: "BHD" },
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

describe("publicPaymentStatusLabel", () => {
  it("maps every internal payment status to a customer-facing label", () => {
    expect(publicPaymentStatusLabel("cash_pending")).toBe("Pay on delivery/pickup");
    expect(publicPaymentStatusLabel("paid")).toBe("Paid");
    expect(publicPaymentStatusLabel("failed")).toBe("Payment failed");
  });
});

describe("buildPublicOrderView", () => {
  it("exposes only public-safe fields", () => {
    const view = buildPublicOrderView(makeOrder());

    expect(view).toEqual({
      orderNumber: "ORD-260130-ABCDEF",
      status: "confirmed",
      fulfillmentMethod: "pickup",
      schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" },
      items: [{ productName: "Ethiopia Yirgacheffe", quantity: 2 }],
      grandTotal: { amount: 5798, currency: "BHD" },
      currency: "BHD",
      paymentStatusLabel: "Pay on delivery/pickup",
      createdAt: expect.any(Date),
    });
  });

  it("never leaks the internal id, idempotency key, or customer contact details", () => {
    const view = buildPublicOrderView(makeOrder()) as unknown as Record<string, unknown>;
    expect(view.id).toBeUndefined();
    expect(view.idempotencyKey).toBeUndefined();
    expect(view.customer).toBeUndefined();
    expect(view.version).toBeUndefined();
  });
});

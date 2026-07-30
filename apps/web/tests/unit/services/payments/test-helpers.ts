import { vi } from "vitest";
import type { Order } from "@/core/orders/entities";
import type { PaymentOrchestrationDeps } from "@/services/payments/dependencies";

export function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date();
  return {
    id: "order-1",
    orderNumber: "ORD-260130-ABCDEF",
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Addr" }, schedule: { date: "2026-08-01", timeWindow: "10:00-12:00" } },
    lines: [],
    subtotal: { amount: 5000, currency: "BHD" },
    shippingFee: { amount: 2000, currency: "BHD" },
    discountTotal: { amount: 0, currency: "BHD" },
    grandTotal: { amount: 7000, currency: "BHD" },
    currency: "BHD",
    paymentMethod: "tap",
    paymentStatus: "pending",
    status: "pending_payment",
    source: "web",
    idempotencyKey: "idem-1",
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockPaymentOrchestrationDeps(): PaymentOrchestrationDeps {
  return {
    payments: {
      payments: {
        findById: vi.fn(),
        findByOrderId: vi.fn().mockResolvedValue(null),
        findByProviderReference: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
      },
      webhookEvents: {
        findById: vi.fn().mockResolvedValue(null),
        record: vi.fn().mockResolvedValue(undefined),
        markProcessed: vi.fn().mockResolvedValue(undefined),
      },
      provider: {
        createCharge: vi.fn(),
        verifyWebhookSignature: vi.fn().mockReturnValue(true),
        parseWebhookEvent: vi.fn(),
        retrieveCharge: vi.fn(),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    orders: {
      findById: vi.fn().mockResolvedValue(null),
      findByOrderNumber: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    },
    inventory: {
      reservations: {
        reserve: vi.fn(),
        release: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        listByOrder: vi.fn().mockResolvedValue([{ id: "r1", orderId: "order-1", productId: "product-1", variantId: null, quantity: 1, status: "reserved", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() }]),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    email: {
      email: { send: vi.fn().mockResolvedValue({ sent: true }) },
      outbox: {
        enqueue: vi.fn().mockResolvedValue({ id: "outbox-1", to: "x", template: "payment_confirmation", data: {}, status: "pending", attempts: 0, createdAt: new Date(), updatedAt: new Date() }),
        markSent: vi.fn().mockResolvedValue(undefined),
        markFailed: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
}

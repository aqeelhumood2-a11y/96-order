import { vi } from "vitest";
import { money } from "@/core/money/money";
import type { Customer } from "@/core/customer/entities";
import type { Order } from "@/core/orders/entities";
import type { OrderManagementDeps } from "@/services/orders/dependencies";

export function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-01T10:00:00Z");
  return {
    id: "order-1",
    orderNumber: "ORD-260801-ABCDEF",
    customer: { fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" },
    fulfillment: { method: "pickup", pickup: { locationId: "main", locationName: "Main", locationAddress: "Manama" }, schedule: { date: "2026-08-05", timeWindow: "10:00-12:00" } },
    lines: [],
    subtotal: money(5000),
    shippingFee: money(2000),
    discountTotal: money(0),
    grandTotal: money(7000),
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

export function createMockOrderManagementDeps(): OrderManagementDeps {
  return {
    orders: {
      findById: vi.fn().mockResolvedValue(null),
      findByOrderNumber: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listByCustomer: vi.fn().mockResolvedValue([]),
    },
    orderEvents: { record: vi.fn().mockResolvedValue(undefined), listByOrder: vi.fn().mockResolvedValue([]) },
    inventory: {
      reservations: {
        reserve: vi.fn(),
        release: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        listByOrder: vi.fn().mockResolvedValue([]),
        listExpired: vi.fn().mockResolvedValue([]),
      },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    customers: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      upsert: vi.fn(async (_id: string, fold: (existing: Customer | null) => Customer) => fold(null)),
    },
    payments: {
      payments: {
        findById: vi.fn(),
        findByOrderId: vi.fn().mockResolvedValue(null),
        findByProviderReference: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
      },
      webhookEvents: { findById: vi.fn(), record: vi.fn(), markProcessed: vi.fn() },
      provider: { createCharge: vi.fn(), verifyWebhookSignature: vi.fn(), parseWebhookEvent: vi.fn(), retrieveCharge: vi.fn() },
      auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
    },
    email: {
      email: { send: vi.fn().mockResolvedValue({ sent: true }) },
      outbox: {
        enqueue: vi.fn().mockResolvedValue({ id: "outbox-1", to: "x", template: "order_confirmation", data: {}, status: "pending", attempts: 0, createdAt: new Date(), updatedAt: new Date() }),
        markSent: vi.fn().mockResolvedValue(undefined),
        markFailed: vi.fn().mockResolvedValue(undefined),
      },
    },
    auditLogs: { record: vi.fn().mockResolvedValue(undefined), list: vi.fn() },
  };
}

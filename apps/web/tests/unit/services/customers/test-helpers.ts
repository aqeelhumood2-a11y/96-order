import { vi } from "vitest";
import { money } from "@/core/money/money";
import type { Customer } from "@/core/customer/entities";
import type { CustomerManagementDeps } from "@/services/customers/dependencies";

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  const now = new Date("2026-08-01T10:00:00Z");
  return {
    id: "ahmed@example.com",
    kind: "guest",
    fullName: "Ahmed Ali",
    email: "ahmed@example.com",
    mobile: "+97336001234",
    totalOrders: 1,
    totalSpent: money(7000),
    firstOrderAt: now,
    lastOrderAt: now,
    searchTokens: ["ahm", "ahmed", "ahmed@example.com"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockCustomerManagementDeps(): CustomerManagementDeps {
  return {
    customers: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      upsert: vi.fn(async (_id: string, fold: (existing: Customer | null) => Customer) => fold(null)),
    },
    orders: {
      findById: vi.fn(),
      findByOrderNumber: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      listByCustomer: vi.fn().mockResolvedValue([]),
    },
  };
}

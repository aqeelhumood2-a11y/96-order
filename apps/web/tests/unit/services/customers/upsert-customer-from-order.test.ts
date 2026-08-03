import { describe, expect, it, vi } from "vitest";
import { money } from "@/core/money/money";
import type { Customer } from "@/core/customer/entities";
import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import { upsertCustomerFromOrder } from "@/services/customers/upsert-customer-from-order";
import { makeCustomer } from "./test-helpers";

describe("upsertCustomerFromOrder", () => {
  it("upserts keyed by the normalized email, folding through the pure rule", async () => {
    const upsert = vi.fn(async (_id: string, fold: (existing: Customer | null) => Customer) => fold(null));
    const customers = { findById: vi.fn(), list: vi.fn(), upsert } as unknown as CustomerRepository;

    const now = new Date("2026-08-03T10:00:00Z");
    const result = await upsertCustomerFromOrder({ fullName: "Ahmed Ali", mobile: "+97336001234", email: "Ahmed@Example.com" }, money(7000), now, customers);

    expect(upsert).toHaveBeenCalledWith("ahmed@example.com", expect.any(Function));
    expect(result.id).toBe("ahmed@example.com");
    expect(result.totalOrders).toBe(1);
    expect(result.totalSpent).toEqual(money(7000));
  });

  it("folds onto an existing customer rather than replacing it", async () => {
    const existing = makeCustomer({ totalOrders: 3, totalSpent: money(10000) });
    const upsert = vi.fn(async (_id: string, fold: (existing: Customer | null) => Customer) => fold(existing));
    const customers = { findById: vi.fn(), list: vi.fn(), upsert } as unknown as CustomerRepository;

    const now = new Date("2026-08-10T10:00:00Z");
    const result = await upsertCustomerFromOrder({ fullName: "Ahmed Ali", mobile: "+97336001234", email: "ahmed@example.com" }, money(2000), now, customers);

    expect(result.totalOrders).toBe(4);
    expect(result.totalSpent).toEqual(money(12000));
  });
});

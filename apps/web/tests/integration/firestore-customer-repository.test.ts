import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import { nextCustomerOnOrderCreated, reverseCancelledOrderSpend } from "@/core/customer/rules";
import { FirestoreCustomerRepository } from "@/infrastructure/firebase/repositories/firestore-customer-repository";

const repo = new FirestoreCustomerRepository();

describe("FirestoreCustomerRepository (emulator)", () => {
  it("upsert() creates a new customer when none exists, then folds a second order onto it", async () => {
    const email = `ahmed-${randomUUID().slice(0, 8)}@example.com`;
    const customer = { fullName: "Ahmed Ali", mobile: "+97336001234", email };
    const now = new Date("2026-08-01T10:00:00Z");

    const created = await repo.upsert(email, (existing) => nextCustomerOnOrderCreated(existing, { customer, grandTotal: money(5000), orderCreatedAt: now }));
    expect(created.totalOrders).toBe(1);
    expect(created.totalSpent).toEqual(money(5000));

    const later = new Date("2026-08-05T10:00:00Z");
    const updated = await repo.upsert(email, (existing) => nextCustomerOnOrderCreated(existing, { customer, grandTotal: money(3000), orderCreatedAt: later }));
    expect(updated.totalOrders).toBe(2);
    expect(updated.totalSpent).toEqual(money(8000));

    const fetched = await repo.findById(email);
    expect(fetched).toEqual(updated);
  });

  it("upsert() reverses spend on a cancellation fold", async () => {
    const email = `ahmed-${randomUUID().slice(0, 8)}@example.com`;
    const customer = { fullName: "Ahmed Ali", mobile: "+97336001234", email };
    const now = new Date();
    await repo.upsert(email, (existing) => nextCustomerOnOrderCreated(existing, { customer, grandTotal: money(5000), orderCreatedAt: now }));

    const reversed = await repo.upsert(email, (existing) => {
      if (!existing) throw new Error("expected an existing customer");
      return reverseCancelledOrderSpend(existing, money(5000), now);
    });

    expect(reversed.totalSpent).toEqual(money(0));
    expect(reversed.totalOrders).toBe(1);
  });

  it("findById() returns null for a customer that doesn't exist", async () => {
    expect(await repo.findById(`missing-${randomUUID()}@example.com`)).toBeNull();
  });

  it("list() filters by a search token", async () => {
    const email = `zara-${randomUUID().slice(0, 8)}@example.com`;
    const customer = { fullName: "Zara Findable", mobile: "+97336009999", email };
    await repo.upsert(email, (existing) => nextCustomerOnOrderCreated(existing, { customer, grandTotal: money(1000), orderCreatedAt: new Date() }));

    const page = await repo.list({ limit: 50, search: "zar" });
    expect(page.items.map((item) => item.id)).toContain(email);
  });
});

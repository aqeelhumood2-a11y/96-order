import { describe, expect, it } from "vitest";
import { money } from "@/core/money/money";
import type { Customer } from "@/core/customer/entities";
import type { OrderCustomerSnapshot } from "@/core/orders/entities";
import {
  buildCustomerSearchTokens,
  customerKeyFromEmail,
  customerMatchesAllQueryWords,
  nextCustomerOnOrderCreated,
  reverseCancelledOrderSpend,
  tokenizeCustomerSearchQuery,
} from "@/core/customer/rules";

function makeSnapshot(overrides: Partial<OrderCustomerSnapshot> = {}): OrderCustomerSnapshot {
  return { fullName: "Ahmed Ali", mobile: "+97336001234", email: "Ahmed@Example.com", ...overrides };
}

describe("customerKeyFromEmail", () => {
  it("normalizes to trimmed lowercase", () => {
    expect(customerKeyFromEmail("  Ahmed@Example.com  ")).toBe("ahmed@example.com");
  });
});

describe("nextCustomerOnOrderCreated", () => {
  const now = new Date("2026-08-03T10:00:00Z");

  it("builds a brand-new customer when none exists", () => {
    const customer = nextCustomerOnOrderCreated(null, { customer: makeSnapshot(), grandTotal: money(5000), orderCreatedAt: now });
    expect(customer.id).toBe("ahmed@example.com");
    expect(customer.kind).toBe("guest");
    expect(customer.totalOrders).toBe(1);
    expect(customer.totalSpent).toEqual(money(5000));
    expect(customer.firstOrderAt).toEqual(now);
    expect(customer.lastOrderAt).toEqual(now);
    expect(customer.searchTokens.length).toBeGreaterThan(0);
  });

  it("increments totals and refreshes contact info for a returning customer", () => {
    const first = nextCustomerOnOrderCreated(null, { customer: makeSnapshot(), grandTotal: money(5000), orderCreatedAt: now });
    const later = new Date("2026-08-10T10:00:00Z");
    const second = nextCustomerOnOrderCreated(first, {
      customer: makeSnapshot({ fullName: "Ahmed A. Ali", companyName: "Acme" }),
      grandTotal: money(3000),
      orderCreatedAt: later,
    });

    expect(second.totalOrders).toBe(2);
    expect(second.totalSpent).toEqual(money(8000));
    expect(second.fullName).toBe("Ahmed A. Ali");
    expect(second.companyName).toBe("Acme");
    expect(second.firstOrderAt).toEqual(now);
    expect(second.lastOrderAt).toEqual(later);
  });
});

describe("reverseCancelledOrderSpend", () => {
  it("subtracts the cancelled order's total from totalSpent without touching totalOrders", () => {
    const now = new Date("2026-08-03T10:00:00Z");
    const customer: Customer = {
      id: "ahmed@example.com",
      kind: "guest",
      fullName: "Ahmed Ali",
      email: "ahmed@example.com",
      mobile: "+97336001234",
      totalOrders: 2,
      totalSpent: money(8000),
      firstOrderAt: now,
      lastOrderAt: now,
      searchTokens: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = reverseCancelledOrderSpend(customer, money(3000), now);
    expect(result.totalSpent).toEqual(money(5000));
    expect(result.totalOrders).toBe(2);
  });

  it("never lets totalSpent go negative", () => {
    const now = new Date();
    const customer: Customer = {
      id: "ahmed@example.com",
      kind: "guest",
      fullName: "Ahmed Ali",
      email: "ahmed@example.com",
      mobile: "+97336001234",
      totalOrders: 1,
      totalSpent: money(1000),
      firstOrderAt: now,
      lastOrderAt: now,
      searchTokens: [],
      createdAt: now,
      updatedAt: now,
    };

    const result = reverseCancelledOrderSpend(customer, money(5000), now);
    expect(result.totalSpent).toEqual(money(0));
  });
});

describe("buildCustomerSearchTokens / tokenizeCustomerSearchQuery / customerMatchesAllQueryWords", () => {
  it("indexes name words, email, and mobile (with and without +973)", () => {
    const tokens = buildCustomerSearchTokens({ fullName: "Ahmed Ali", email: "ahmed@example.com", mobile: "+97336001234" });
    expect(tokens).toContain("ahm");
    expect(tokens).toContain("ahmed@example.com");
    expect(tokens).toContain("+973360");
    expect(tokens).toContain("360012");
  });

  it("matches only when every query word is present", () => {
    const customer = { fullName: "Ahmed Ali", email: "ahmed@example.com", mobile: "+97336001234", companyName: undefined };
    expect(customerMatchesAllQueryWords(customer, tokenizeCustomerSearchQuery("ahmed ali"))).toBe(true);
    expect(customerMatchesAllQueryWords(customer, tokenizeCustomerSearchQuery("ahmed hassan"))).toBe(false);
  });
});

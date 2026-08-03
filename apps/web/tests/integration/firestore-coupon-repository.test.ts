import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Coupon } from "@/core/coupons/entities";
import { FirestoreCouponRepository } from "@/infrastructure/firebase/repositories/firestore-coupon-repository";

const repo = new FirestoreCouponRepository();

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  const now = new Date();
  return {
    code: `SAVE-${randomUUID().slice(0, 8).toUpperCase()}`,
    description: "10% off",
    type: "percentage",
    value: 10,
    scope: { categoryIds: [], brandIds: [] },
    excludedProductIds: [],
    excludedCategoryIds: [],
    minSubtotal: null,
    maxDiscountCap: null,
    startsAt: null,
    endsAt: null,
    active: true,
    usageLimit: null,
    usageCount: 0,
    perCustomerLimit: null,
    firstOrderOnly: false,
    stackable: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "admin-1",
    updatedBy: "admin-1",
    ...overrides,
  };
}

describe("FirestoreCouponRepository (emulator)", () => {
  it("create() then findByCode() round-trips the coupon, keyed by its own code", async () => {
    const coupon = makeCoupon();
    await repo.create(coupon);
    expect(await repo.findByCode(coupon.code)).toEqual(coupon);
  });

  it("redeem() increments usageCount and records a redemption", async () => {
    const coupon = makeCoupon();
    await repo.create(coupon);
    const orderId = randomUUID();

    const ok = await repo.redeem(coupon.code, orderId, "shopper@example.com", 1000);
    expect(ok).toBe(true);

    const updated = await repo.findByCode(coupon.code);
    expect(updated?.usageCount).toBe(1);
    expect(await repo.countRedemptionsByCustomer(coupon.code, "shopper@example.com")).toBe(1);
  });

  it("redeem() is idempotent for the same order id — retrying never double-counts", async () => {
    const coupon = makeCoupon();
    await repo.create(coupon);
    const orderId = randomUUID();

    await repo.redeem(coupon.code, orderId, "shopper@example.com", 1000);
    const secondCall = await repo.redeem(coupon.code, orderId, "shopper@example.com", 1000);

    expect(secondCall).toBe(true);
    const updated = await repo.findByCode(coupon.code);
    expect(updated?.usageCount).toBe(1);
  });

  it("redeem() refuses once usageLimit is reached", async () => {
    const coupon = makeCoupon({ usageLimit: 1 });
    await repo.create(coupon);

    const first = await repo.redeem(coupon.code, randomUUID(), "a@example.com", 1000);
    expect(first).toBe(true);

    const second = await repo.redeem(coupon.code, randomUUID(), "b@example.com", 1000);
    expect(second).toBe(false);

    const updated = await repo.findByCode(coupon.code);
    expect(updated?.usageCount).toBe(1);
  });

  it("redeem() returns false for a coupon code that doesn't exist", async () => {
    expect(await repo.redeem("NO-SUCH-CODE", randomUUID(), "a@example.com", 1000)).toBe(false);
  });

  it("update() applies a partial patch", async () => {
    const coupon = makeCoupon();
    await repo.create(coupon);

    await repo.update(coupon.code, { active: false });
    expect((await repo.findByCode(coupon.code))?.active).toBe(false);
  });
});

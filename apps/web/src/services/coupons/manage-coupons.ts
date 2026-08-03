import type { Session } from "@/core/auth/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { ConflictError, NotFoundError } from "@/core/errors";
import { money } from "@/core/money/money";
import { normalizeCouponCode, type Coupon } from "@/core/coupons/entities";
import { couponInputSchema, type CouponInput } from "@/core/coupons/schemas";
import { requirePermission } from "@/services/auth/session";
import { defaultPricingDeps, type PricingDeps } from "@/services/pricing/dependencies";

export async function listCoupons(actor: Session, request: PageRequest, deps: PricingDeps = defaultPricingDeps): Promise<Page<Coupon>> {
  requirePermission(actor, "promotions:view");
  return deps.coupons.list(request);
}

export async function createCoupon(actor: Session, input: CouponInput, deps: PricingDeps = defaultPricingDeps): Promise<Coupon> {
  requirePermission(actor, "promotions:manage");
  const parsed = couponInputSchema.parse(input);
  const code = normalizeCouponCode(parsed.code);

  const existing = await deps.coupons.findByCode(code);
  if (existing) {
    throw new ConflictError("A coupon with this code already exists.");
  }

  const now = new Date();
  const coupon: Coupon = {
    code,
    description: parsed.description,
    type: parsed.type,
    value: parsed.value,
    scope: parsed.scope,
    excludedProductIds: parsed.excludedProductIds,
    excludedCategoryIds: parsed.excludedCategoryIds,
    minSubtotal: parsed.minSubtotal !== null ? money(parsed.minSubtotal) : null,
    maxDiscountCap: parsed.maxDiscountCap !== null ? money(parsed.maxDiscountCap) : null,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    active: parsed.active,
    usageLimit: parsed.usageLimit,
    usageCount: 0,
    perCustomerLimit: parsed.perCustomerLimit,
    firstOrderOnly: parsed.firstOrderOnly,
    stackable: parsed.stackable,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  };
  await deps.coupons.create(coupon);
  await deps.auditLogs.record({ type: "coupon_created", actorUid: actor.uid, actorEmail: actor.email, metadata: { code } });
  return coupon;
}

export async function updateCoupon(actor: Session, code: string, input: CouponInput, deps: PricingDeps = defaultPricingDeps): Promise<void> {
  requirePermission(actor, "promotions:manage");
  const normalizedCode = normalizeCouponCode(code);
  const existing = await deps.coupons.findByCode(normalizedCode);
  if (!existing) throw new NotFoundError("Coupon not found.");

  const parsed = couponInputSchema.parse(input);
  await deps.coupons.update(normalizedCode, {
    description: parsed.description,
    type: parsed.type,
    value: parsed.value,
    scope: parsed.scope,
    excludedProductIds: parsed.excludedProductIds,
    excludedCategoryIds: parsed.excludedCategoryIds,
    minSubtotal: parsed.minSubtotal !== null ? money(parsed.minSubtotal) : null,
    maxDiscountCap: parsed.maxDiscountCap !== null ? money(parsed.maxDiscountCap) : null,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    active: parsed.active,
    usageLimit: parsed.usageLimit,
    perCustomerLimit: parsed.perCustomerLimit,
    firstOrderOnly: parsed.firstOrderOnly,
    stackable: parsed.stackable,
    updatedBy: actor.uid,
  });
  await deps.auditLogs.record({ type: "coupon_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { code: normalizedCode } });
}

export async function setCouponActive(actor: Session, code: string, active: boolean, deps: PricingDeps = defaultPricingDeps): Promise<void> {
  requirePermission(actor, "promotions:manage");
  const normalizedCode = normalizeCouponCode(code);
  const existing = await deps.coupons.findByCode(normalizedCode);
  if (!existing) throw new NotFoundError("Coupon not found.");
  await deps.coupons.update(normalizedCode, { active, updatedBy: actor.uid });
  await deps.auditLogs.record({ type: "coupon_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { code: normalizedCode, active } });
}

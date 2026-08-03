import { randomUUID } from "node:crypto";
import type { Session } from "@/core/auth/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { NotFoundError } from "@/core/errors";
import type { Promotion } from "@/core/promotions/entities";
import { promotionInputSchema, type PromotionInput } from "@/core/promotions/schemas";
import { requirePermission } from "@/services/auth/session";
import { defaultPricingDeps, type PricingDeps } from "@/services/pricing/dependencies";

export async function listPromotions(actor: Session, request: PageRequest, deps: PricingDeps = defaultPricingDeps): Promise<Page<Promotion>> {
  requirePermission(actor, "promotions:view");
  return deps.promotions.list(request);
}

export async function createPromotion(actor: Session, input: PromotionInput, deps: PricingDeps = defaultPricingDeps): Promise<Promotion> {
  requirePermission(actor, "promotions:manage");
  const parsed = promotionInputSchema.parse(input);
  const now = new Date();
  const promotion: Promotion = { id: randomUUID(), ...parsed, createdAt: now, updatedAt: now, createdBy: actor.uid, updatedBy: actor.uid };
  await deps.promotions.create(promotion);
  await deps.auditLogs.record({ type: "promotion_created", actorUid: actor.uid, actorEmail: actor.email, metadata: { promotionId: promotion.id } });
  return promotion;
}

export async function updatePromotion(actor: Session, id: string, input: PromotionInput, deps: PricingDeps = defaultPricingDeps): Promise<void> {
  requirePermission(actor, "promotions:manage");
  const existing = await deps.promotions.findById(id);
  if (!existing) throw new NotFoundError("Promotion not found.");
  const parsed = promotionInputSchema.parse(input);
  await deps.promotions.update(id, { ...parsed, updatedBy: actor.uid });
  await deps.auditLogs.record({ type: "promotion_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { promotionId: id } });
}

export async function setPromotionActive(actor: Session, id: string, active: boolean, deps: PricingDeps = defaultPricingDeps): Promise<void> {
  requirePermission(actor, "promotions:manage");
  const existing = await deps.promotions.findById(id);
  if (!existing) throw new NotFoundError("Promotion not found.");
  await deps.promotions.update(id, { active, updatedBy: actor.uid });
  await deps.auditLogs.record({ type: "promotion_updated", actorUid: actor.uid, actorEmail: actor.email, metadata: { promotionId: id, active } });
}

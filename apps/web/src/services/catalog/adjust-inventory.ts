import { after } from "next/server";
import type { Session } from "@/core/auth/entities";
import { type AdjustInventoryInput, adjustInventorySchema } from "@/core/catalog/schemas";
import type { AdjustInventoryResult } from "@/core/interfaces/inventory-repository";
import { NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "@/services/auth/session";
import { notifyBackInStock } from "@/services/back-in-stock/notify-restock";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

/**
 * The only way `onHand` ever changes — see `InventoryRepository.adjust()`'s
 * doc comment for the transactional guarantee. This use case's job is
 * everything *before* the transaction: permission, looking up whether the
 * target (product or variant) allows backorder, and audit logging after.
 */
export async function adjustInventory(
  actor: Session,
  input: AdjustInventoryInput,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<AdjustInventoryResult> {
  requirePermission(actor, "inventory:adjust");
  const parsed = adjustInventorySchema.parse(input);

  const product = await deps.products.findById(parsed.productId);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }

  let allowBackorder = product.allowBackorder;
  if (parsed.variantId) {
    const variant = product.variants.find((candidate) => candidate.id === parsed.variantId);
    if (!variant) {
      throw new ValidationError("Variant not found on this product.");
    }
    allowBackorder = variant.allowBackorder;
  }

  const result = await deps.inventory.adjust({
    productId: parsed.productId,
    variantId: parsed.variantId,
    reason: parsed.reason,
    quantityDelta: parsed.quantityDelta,
    allowBackorder,
    note: parsed.note,
    actorId: actor.uid,
  });

  await deps.auditLogs.record({
    type: "inventory_adjusted",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: {
      productId: parsed.productId,
      variantId: parsed.variantId,
      reason: parsed.reason,
      quantityDelta: parsed.quantityDelta,
      onHandBefore: result.adjustment.onHandBefore,
      onHandAfter: result.adjustment.onHandAfter,
    },
  });

  const availableBefore = result.adjustment.onHandBefore - result.record.reserved;
  const availableAfter = result.adjustment.onHandAfter - result.record.reserved;
  if (availableBefore <= 0 && availableAfter > 0) {
    // Fire-and-forget, scheduled after the response — a back-in-stock email
    // failure must never affect (or slow down) this inventory adjustment.
    after(() => notifyBackInStock(parsed.productId, parsed.variantId).catch(() => undefined));
  }

  return result;
}

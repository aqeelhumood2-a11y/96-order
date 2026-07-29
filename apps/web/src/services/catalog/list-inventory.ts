import type { Session } from "@/core/auth/entities";
import type { InventoryAdjustment, InventoryRecord } from "@/core/catalog/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCatalogDeps, type CatalogDeps } from "./dependencies";

export async function listInventoryByProduct(
  actor: Session,
  productId: string,
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<InventoryRecord[]> {
  requirePermission(actor, "inventory:view");
  return deps.inventory.listByProduct(productId);
}

export async function listLowStockInventory(actor: Session, limit: number, deps: CatalogDeps = defaultCatalogDeps): Promise<InventoryRecord[]> {
  requirePermission(actor, "inventory:view");
  return deps.inventory.listLowStock(limit);
}

export async function listInventoryAdjustments(
  actor: Session,
  request: PageRequest & { productId?: string; variantId?: string | null },
  deps: CatalogDeps = defaultCatalogDeps,
): Promise<Page<InventoryAdjustment>> {
  requirePermission(actor, "inventory:view");
  return deps.inventoryAdjustments.list(request);
}

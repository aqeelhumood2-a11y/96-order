import type { InventoryAdjustment, InventoryAdjustmentReason, InventoryRecord } from "@/core/catalog/entities";

export interface AdjustInventoryInput {
  productId: string;
  variantId: string | null;
  reason: InventoryAdjustmentReason;
  quantityDelta: number;
  allowBackorder: boolean;
  note?: string;
  actorId: string;
}

export interface AdjustInventoryResult {
  record: InventoryRecord;
  adjustment: InventoryAdjustment;
}

/**
 * Port for inventory records (`inventory` collection) and their mutation.
 * `adjust()` is the only way `onHand` ever changes — it's a single
 * Firestore transaction that reads the current record, enforces the
 * backorder rule, writes the updated record, and appends the ledger entry
 * (`inventoryAdjustments`) together, so concurrent adjustments serialize
 * safely and the ledger can never disagree with the running total. See
 * `InventoryAdjustmentRepository` for read-only ledger history access.
 */
export interface InventoryRepository {
  findByProductAndVariant(productId: string, variantId: string | null): Promise<InventoryRecord | null>;
  listByProduct(productId: string): Promise<InventoryRecord[]>;
  listLowStock(limit: number): Promise<InventoryRecord[]>;
  /** Phase 6: every tracked record whose available quantity (`onHand - reserved`, `core/catalog/rules.ts#computeAvailableQuantity`) is zero or negative — the dashboard/inventory-alerts "out of stock" list. */
  listOutOfStock(limit: number): Promise<InventoryRecord[]>;
  /** Idempotent: creates a zeroed record if one doesn't exist yet, otherwise returns the existing one unchanged. */
  ensureExists(productId: string, variantId: string | null, lowStockThreshold: number | undefined, actorId: string): Promise<InventoryRecord>;
  /** Throws `ConflictError` (not `ValidationError`) when the decrease would take available stock negative and backorder isn't allowed — this is a state conflict, not a malformed request. */
  adjust(input: AdjustInventoryInput): Promise<AdjustInventoryResult>;
}

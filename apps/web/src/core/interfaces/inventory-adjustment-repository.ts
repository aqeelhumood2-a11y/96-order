import type { InventoryAdjustment } from "@/core/catalog/entities";
import type { Page, PageRequest } from "./repository";

export interface ListInventoryAdjustmentsRequest extends PageRequest {
  productId?: string;
  variantId?: string | null;
}

/**
 * Read-only history access. Adjustments are only ever created as part of
 * `InventoryRepository.adjust()`'s transaction — there is deliberately no
 * `create`/`update`/`delete` here, the same append-only-by-port-shape
 * pattern Phase 2 established for `AuditLogRepository`.
 */
export interface InventoryAdjustmentRepository {
  list(request: ListInventoryAdjustmentsRequest): Promise<Page<InventoryAdjustment>>;
}

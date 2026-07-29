import type { InventoryRecord, ProductVariant, VariantAttributeSelections } from "./entities";

/**
 * `available` is deliberately never persisted alongside `onHand`/`reserved`
 * — storing a third field that's purely a function of the other two would
 * let it drift out of sync (e.g. an adjustment that updates `onHand` but
 * forgets to recompute `available`). Computing it on read is cheap and
 * can never be wrong.
 */
export function computeAvailableQuantity(record: Pick<InventoryRecord, "onHand" | "reserved">): number {
  return record.onHand - record.reserved;
}

/**
 * Whether taking `quantity` more units out of stock (an order line, a
 * manual "stock_out" adjustment, etc.) is allowed. Backorder-enabled
 * products/variants may go negative; everything else may not.
 */
export function canDecreaseStock(
  record: Pick<InventoryRecord, "onHand" | "reserved">,
  quantity: number,
  allowBackorder: boolean,
): boolean {
  if (allowBackorder) return true;
  return computeAvailableQuantity(record) - quantity >= 0;
}

/** Order-independent key for a variant's attribute selections, used to detect duplicate combinations. */
export function variantSelectionsKey(selections: VariantAttributeSelections): string {
  return Object.entries(selections)
    .map(([key, value]) => [key.trim().toLowerCase(), value.trim().toLowerCase()] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/**
 * True if `selections` duplicates another variant's combination in the
 * same product. `excludeVariantId` lets an update check against every
 * *other* variant without tripping on itself.
 */
export function hasDuplicateVariantCombination(
  variants: readonly ProductVariant[],
  selections: VariantAttributeSelections,
  excludeVariantId?: string,
): boolean {
  const key = variantSelectionsKey(selections);
  return variants.some((variant) => variant.id !== excludeVariantId && variantSelectionsKey(variant.attributeSelections) === key);
}

/** Normalizes a SKU/barcode for uniqueness comparisons — case/whitespace shouldn't create a false distinction. */
export function normalizeCatalogCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isCompareAtPriceValid(basePrice: number, compareAtPrice: number | undefined): boolean {
  if (compareAtPrice === undefined) return true;
  return compareAtPrice > basePrice;
}

export interface CategoryParentLookup {
  (id: string): Promise<{ id: string; parentId: string | null } | null>;
}

/**
 * Walks up from `candidateParentId` looking for `categoryId` — if found,
 * assigning `candidateParentId` as `categoryId`'s parent would create a
 * cycle. Also rejects a category being made its own parent directly.
 * Bounded to `maxDepth` hops so a corrupt/cyclic tree already in storage
 * can't hang this check in an infinite loop.
 */
export async function wouldCreateCircularCategoryReference(
  categoryId: string,
  candidateParentId: string | null,
  lookupParent: CategoryParentLookup,
  maxDepth = 50,
): Promise<boolean> {
  if (candidateParentId === null) return false;
  if (candidateParentId === categoryId) return true;

  let currentId: string | null = candidateParentId;
  for (let depth = 0; depth < maxDepth && currentId !== null; depth++) {
    const current = await lookupParent(currentId);
    if (!current) return false;
    if (current.parentId === categoryId) return true;
    currentId = current.parentId;
  }
  return false;
}

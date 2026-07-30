import type { Brand, Category, InventoryRecord, Product } from "@/core/catalog/entities";
import { variantSelectionsKey } from "@/core/catalog/rules";
import type { PublicAvailability, PublicProductSummary, PublicVariant } from "./dto";

/**
 * The one gate every public read path must apply before a product is ever
 * mapped to a DTO or returned to a caller — draft/archived status or
 * hidden visibility must never reach the browser. Every public repository
 * bakes the equivalent Firestore equality filters
 * (`status == "active"`, `visibility == "visible"`) into the query itself
 * rather than filtering client-side after the fact, but this function is
 * what integration tests assert against directly, and what a defense-in-
 * depth check re-verifies on any document fetched by a keyed lookup
 * (`findBySlug`) that isn't itself a filtered query.
 */
export function isPubliclyVisible(product: Pick<Product, "status" | "visibility">): boolean {
  return product.status === "active" && product.visibility === "visible";
}

export function isCategoryPublic(category: Pick<Category, "isActive">): boolean {
  return category.isActive;
}

export function isBrandPublic(brand: Pick<Brand, "isActive">): boolean {
  return brand.isActive;
}

/**
 * Storefront-safe availability — `inStock`/`lowStock` booleans only, never
 * the underlying `onHand`/`reserved` numbers or any adjustment history.
 * `record` is `null` when a product/variant doesn't track inventory (or
 * has no record yet) — untracked stock is always treated as in stock,
 * since there's nothing to run out of.
 */
export function computeAvailability(
  record: Pick<InventoryRecord, "onHand" | "reserved" | "lowStockThreshold"> | null,
  allowBackorder: boolean,
  trackInventory: boolean,
): PublicAvailability {
  if (!trackInventory || !record) {
    return { inStock: true, lowStock: false };
  }

  const available = record.onHand - record.reserved;
  const inStock = available > 0 || allowBackorder;
  const lowStock = inStock && record.lowStockThreshold !== undefined && available <= record.lowStockThreshold;
  return { inStock, lowStock };
}

/** Finds the one variant (if any) whose attribute selections exactly match `selections` — the same normalized comparison Phase 3 uses to detect duplicates. */
export function findMatchingVariant(variants: readonly PublicVariant[], selections: Record<string, string>): PublicVariant | null {
  const key = variantSelectionsKey(selections);
  return variants.find((variant) => variantSelectionsKey(variant.attributeSelections) === key) ?? null;
}

/**
 * Given the variants already selectable and a partial in-progress
 * selection, returns the set of values still reachable for `attributeName`
 * — i.e. the values that appear in at least one variant consistent with
 * every *other* attribute currently selected. This is what lets the UI
 * disable/hide combinations that don't exist as a real variant, rather
 * than letting a shopper pick a combination that has no matching SKU.
 */
export function getAvailableAttributeValues(
  variants: readonly PublicVariant[],
  currentSelections: Record<string, string>,
  attributeName: string,
): Set<string> {
  const otherSelections = Object.fromEntries(Object.entries(currentSelections).filter(([key]) => key !== attributeName));

  const values = new Set<string>();
  for (const variant of variants) {
    const consistent = Object.entries(otherSelections).every(([key, value]) => variant.attributeSelections[key] === value);
    if (consistent && variant.attributeSelections[attributeName] !== undefined) {
      values.add(variant.attributeSelections[attributeName]!);
    }
  }
  return values;
}

/** Every distinct attribute name used across a product's variants, in first-seen order — drives which selector rows the variant UI renders. */
export function listVariantAttributeNames(variants: readonly PublicVariant[]): string[] {
  const names: string[] = [];
  for (const variant of variants) {
    for (const name of Object.keys(variant.attributeSelections)) {
      if (!names.includes(name)) names.push(name);
    }
  }
  return names;
}

export function isWithinPriceRange(price: number, minPrice: number | undefined, maxPrice: number | undefined): boolean {
  if (minPrice !== undefined && price < minPrice) return false;
  if (maxPrice !== undefined && price > maxPrice) return false;
  return true;
}

export function matchesAvailabilityFilter(availability: PublicAvailability, filter: "all" | "in_stock" | undefined): boolean {
  if (filter === "in_stock") return availability.inStock;
  return true;
}

/**
 * Excludes the current product and caps the result — the actual candidate
 * selection (same primary category) happens at the query layer
 * (`services/storefront/list-related-products.ts`); this is the pure part
 * of that logic, kept separate so it's testable without a repository.
 */
export function selectRelatedProducts(
  candidates: readonly PublicProductSummary[],
  currentProductId: string,
  limit: number,
): PublicProductSummary[] {
  return candidates.filter((candidate) => candidate.id !== currentProductId).slice(0, limit);
}

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

// --- Phase 4 search tokens ---
//
// These live here (next to the `Product` entity they augment) rather than
// under `core/storefront/` — `searchTokens` is a field *on* `Product`,
// computed at write time in `services/catalog/{create,update}-product.ts`,
// so it belongs with the rest of that entity's invariants. The read side
// (`services/storefront/search-products.ts`) imports `tokenizeQuery`/
// `matchesAllQueryWords` from here rather than duplicating them.

const SEARCH_WORD_MIN_LENGTH = 2;
const TOKEN_PREFIX_MIN_LENGTH = 2;
const MAX_SEARCH_TOKENS_PER_PRODUCT = 300;

// Strips combining marks after NFKD normalization (the Unicode "Mark"
// category `\p{M}`) — the same diacritic-stripping intent as
// @96order/shared's slugify(), expressed as a property escape instead of an
// explicit codepoint range so there's no raw combining-character literal
// sitting in this file's source.
const COMBINING_MARKS = /\p{M}/gu;

function wordsOf(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= SEARCH_WORD_MIN_LENGTH);
}

/** All prefixes of `word` from length `TOKEN_PREFIX_MIN_LENGTH` up to its full length — what makes a Firestore `array-contains` search behave like "starts with". */
function prefixesOf(word: string): string[] {
  const prefixes: string[] = [];
  for (let length = TOKEN_PREFIX_MIN_LENGTH; length <= word.length; length++) {
    prefixes.push(word.slice(0, length));
  }
  return prefixes;
}

/**
 * Builds the denormalized `searchTokens` array stored on a product
 * document — see README's Search strategy section for the full design
 * rationale (why prefix tokens on the document itself, instead of a
 * separate search-index collection or an external engine). Exact
 * lowercased SKU/barcode are included whole (not just as prefixes) since
 * those are looked up as complete codes as often as typed partially.
 */
export function buildSearchTokens(input: {
  name: string;
  sku: string;
  barcode?: string;
  tags: readonly string[];
  productType: string;
  brandName?: string;
  categoryName?: string;
  variantSkus?: readonly string[];
  /** Phase 7: `CoffeeAttributes.originCountry`/`.region` — "Ethiopia", "Yirgacheffe", etc. become searchable words, same as name/brand/category; never barcode-like exact-match fields. */
  coffeeOriginCountry?: string;
  coffeeRegion?: string;
}): string[] {
  const tokens = new Set<string>();

  const addWordsAndPrefixes = (value: string | undefined) => {
    if (!value) return;
    for (const word of wordsOf(value)) {
      for (const prefix of prefixesOf(word)) {
        tokens.add(prefix);
      }
    }
  };

  addWordsAndPrefixes(input.name);
  addWordsAndPrefixes(input.productType);
  addWordsAndPrefixes(input.brandName);
  addWordsAndPrefixes(input.categoryName);
  addWordsAndPrefixes(input.coffeeOriginCountry);
  addWordsAndPrefixes(input.coffeeRegion);
  for (const tag of input.tags) addWordsAndPrefixes(tag);

  const addExactCode = (value: string | undefined) => {
    if (!value) return;
    tokens.add(value.trim().toLowerCase());
  };
  addExactCode(input.sku);
  addExactCode(input.barcode);
  for (const variantSku of input.variantSkus ?? []) addExactCode(variantSku);

  return Array.from(tokens).slice(0, MAX_SEARCH_TOKENS_PER_PRODUCT);
}

/** Normalizes a raw search query into the words used both to pick the primary Firestore token and to refine candidates in-memory. */
export function tokenizeQuery(query: string): string[] {
  return wordsOf(query);
}

/**
 * True if every query word appears as a substring somewhere in the
 * product's own searchable text — the in-memory refinement step applied
 * to the bounded page a search query already fetched (never re-queries
 * Firestore, never scans the whole catalog). See
 * `services/storefront/search-products.ts` for where this is used.
 */
export function matchesAllQueryWords(searchableText: readonly string[], queryWords: readonly string[]): boolean {
  const haystack = searchableText.join(" ").toLowerCase();
  return queryWords.every((word) => haystack.includes(word));
}

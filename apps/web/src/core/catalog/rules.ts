import type { InventoryRecord, ProductVariant, VariantAttributeSelections } from "./entities";

/**
 * A `ProductImage.storagePath` normally names an object in this app's own
 * Firebase Storage bucket (see the field's doc comment), but a product
 * image can also be added by pasting an externally-hosted URL directly
 * (e.g. a Google Drive share link converted to a direct-view URL) instead
 * of uploading a file — see `services/catalog/upload-product-image.ts#addProductImageByUrl`.
 * Both kinds are stored in the same field so every existing reader that
 * already resolves `storagePath` into a display URL keeps working
 * unchanged; this is the one predicate that tells the two apart.
 */
export function isExternalImageUrl(storagePath: string): boolean {
  return storagePath.startsWith("http://") || storagePath.startsWith("https://");
}

/**
 * A Google Drive file id (copied straight out of the Drive app, the way an
 * admin would on a phone) is a bare alphanumeric/`-`/`_` token — never a
 * full URL. Sharing this one pattern between `normalizeImageUrl` and
 * `addProductImageByUrlSchema` (see `schemas.ts`) is what lets that field
 * accept either a full URL or a bare id without duplicating the shape
 * check.
 */
const DRIVE_FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,100}$/;

export function isDriveFileId(value: string): boolean {
  return DRIVE_FILE_ID_PATTERN.test(value);
}

// The exact file-id extraction patterns and output URL shape used by this
// company's other Google-Drive-backed project (maawoon-menu's
// `ImageUploader.tsx#getGoogleDriveImageUrl`), which is verified working in
// production there — ported as-is rather than re-derived, since this app's
// own two earlier attempts (`uc?export=view`, then Drive's `thumbnail`
// endpoint) both turned out to be unreliable for third-party hotlinking in
// practice. `lh3.googleusercontent.com` is Google's photo/image CDN host,
// not the Drive UI host, which is what makes it hotlink-reliable where the
// `drive.google.com/...` forms are not.
const DRIVE_SHARE_LINK_PATTERNS = [
  /\/file\/d\/([^/?]+)/, // .../file/d/<id>/view?usp=...
  /[?&]id=([^&]+)/, // .../open?id=<id>, .../uc?id=<id> or .../uc?export=view&id=<id>
  /googleusercontent\.com\/d\/([^/?=]+)/, // already in this app's own output form — stops at "=" so a record saved under the old `=w1600`-suffixed format self-heals to the current suffix-less form on re-normalization
];

/**
 * No size suffix — this is byte-for-byte the URL shape maawoon-menu's
 * `ImageUploader.tsx#getGoogleDriveImageUrl` produces and serves live in
 * production today. An earlier version of this function appended `=w1600`
 * to cap the served resolution; that was a deviation from "the exact same
 * code" this was supposed to be a port of, and is suspected of being what
 * made some files 403 here that work fine unsized — Google's `lh3` host can
 * treat a plain `/d/<id>` request and a `/d/<id>=w1600` resize request as
 * different code paths with different reliability. Removing it trades away
 * the resolution cap in exchange for matching the one URL shape known to
 * actually work.
 */
function driveImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * What an admin actually has to paste is whatever their phone's share
 * sheet hands them — for Google Drive that's a "view this file" page
 * (`.../file/d/<id>/view?usp=drivesdk` or `.../open?id=<id>`), or just the
 * bare file id copied directly, not a direct image byte stream, so used
 * as-is it renders as a broken image. Rewriting it here means the admin
 * never has to manually extract the file id or reconstruct a URL by hand —
 * whatever they paste from Drive's own share button (or just the id) just
 * works. Any URL that doesn't match a known Drive shape passes through
 * unchanged, so a genuinely different external host is untouched.
 *
 * This runs both when an image is added (`services/catalog/upload-product-image.ts#addProductImageByUrl`),
 * live in the admin form as the admin types (`ProductImages`'s preview, so
 * a broken link is obvious before saving, not after), and every time an
 * already-saved external image is resolved for display
 * (`infrastructure/firebase/product-image-storage.ts#getDownloadUrl`) — the
 * last call site is what transparently upgrades a record saved before this
 * function existed, or saved with an earlier/less reliable URL form, to the
 * current format without needing to delete and re-add it.
 */
export function normalizeImageUrl(url: string): string {
  const trimmed = url.trim();
  for (const pattern of DRIVE_SHARE_LINK_PATTERNS) {
    const fileId = trimmed.match(pattern)?.[1];
    if (fileId) return driveImageUrl(fileId);
  }
  if (isDriveFileId(trimmed)) return driveImageUrl(trimmed);
  return trimmed;
}

const DRIVE_HOTLINK_PATTERN = /^https:\/\/lh3\.googleusercontent\.com\/d\/([^/?]+)$/;

/**
 * Rewrites this app's own canonical Drive hotlink URL (what
 * `normalizeImageUrl` above produces/stores) to a same-origin proxy path
 * served by `app/api/drive-image/[fileId]/route.ts`. That route re-fetches
 * the file through the official, documented Drive API
 * (`files.get?alt=media`) instead of the browser hitting
 * `lh3.googleusercontent.com` directly — this app tried three different
 * shapes of that undocumented hotlink trick (`uc?export=view`, the
 * `thumbnail` endpoint, then this one) and confirmed, file by file, that
 * Google's own servers can return a genuine 403 for it even when the file's
 * sharing is fully correct ("anyone with the link: viewer") — a reliability
 * problem in Google's serving of that URL shape, not in this app's request
 * for it. The Drive API's own `alt=media` download, authenticated with a
 * plain API key, is the officially supported way to fetch a publicly-shared
 * file's bytes and doesn't share that failure mode.
 *
 * Only ever applied by a caller that has confirmed `GOOGLE_DRIVE_API_KEY`
 * (server) / `NEXT_PUBLIC_GOOGLE_DRIVE_IMAGE_PROXY_ENABLED` (client) is
 * actually configured — see `docs/environment-variables.md`. With neither
 * set, callers keep using the direct hotlink URL exactly as before, so a
 * site that hasn't configured the proxy never regresses.
 */
export function toDriveProxyUrl(url: string): string {
  const fileId = url.match(DRIVE_HOTLINK_PATTERN)?.[1];
  return fileId ? `/api/drive-image/${fileId}` : url;
}

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

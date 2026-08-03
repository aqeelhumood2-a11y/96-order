/**
 * Guest wishlist seam — a signed-out visitor has no server-side identity a
 * wishlist row could be attached to (unlike carts, which get a signed
 * cookie id even for guests), so their wishlist lives entirely in
 * `localStorage` as a plain array of `productId:variantId` keys. On login,
 * `WishlistProvider` replays this list into the real server-side wishlist
 * one `add()` call at a time and then clears it — see its doc comment.
 */

const STORAGE_KEY = "96order:guestWishlist";

function readRaw(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function writeRaw(keys: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getLocalWishlistKeys(): string[] {
  return readRaw();
}

export function addLocalWishlistKey(key: string): void {
  const keys = readRaw();
  if (!keys.includes(key)) writeRaw([...keys, key]);
}

export function removeLocalWishlistKey(key: string): void {
  writeRaw(readRaw().filter((entry) => entry !== key));
}

export function clearLocalWishlist(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

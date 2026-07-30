const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Currency is hardcoded to USD — Phase 1–3 never finalized a real
 * currency or locale, and Phase 4's scope is display only (see README's
 * Known limitations). `minorUnits` matches how `Product.basePrice` etc.
 * are stored (the smallest currency unit, e.g. cents); swapping the
 * currency later is a change to this one function, not a schema change.
 */
export function formatPrice(minorUnits: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minorUnits / MINOR_UNITS_PER_MAJOR);
}

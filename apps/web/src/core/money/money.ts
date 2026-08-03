/**
 * A currency-tagged, minor-unit integer amount — the one representation
 * every price/total in the codebase is computed and stored in. BHD's minor
 * unit is the fils (1 BHD = 1,000 fils, three decimal places), not the more
 * common two, which is why `minorUnitsPerMajor`/`decimalDigits` live on the
 * currency definition instead of a hardcoded "divide by 100" the way
 * Phase 1-4's USD-only `lib/format.ts` did. Every arithmetic helper here
 * works in integers (`Math.round` only ever appears in `multiply`, for
 * quantity scaling) — nothing in this module ever does currency math with
 * a JS float, which is what makes it safe to total up a cart.
 */
export type CurrencyCode = "BHD";

export interface CurrencyDefinition {
  code: CurrencyCode;
  /** 1000 for BHD (fils). */
  minorUnitsPerMajor: number;
  /** 3 for BHD. */
  decimalDigits: number;
}

export const BHD: CurrencyDefinition = { code: "BHD", minorUnitsPerMajor: 1000, decimalDigits: 3 };

/**
 * Phase 5's only active currency. A second market's currency is added by
 * introducing another `CurrencyDefinition` and a lookup keyed by market/
 * locale — not by redesigning `Money` itself, which is already
 * currency-tagged and carries no assumption that every amount is BHD.
 * See README's Future multi-currency seam.
 */
export const ACTIVE_CURRENCY: CurrencyDefinition = BHD;

export interface Money {
  /** Integer minor units (fils for BHD) — never a float, never a major-unit decimal string. */
  amount: number;
  currency: CurrencyCode;
}

export function money(amount: number, currency: CurrencyCode = ACTIVE_CURRENCY.code): Money {
  if (!Number.isInteger(amount)) {
    throw new TypeError(`Money amount must be an integer minor-unit value, got ${amount}`);
  }
  return { amount, currency };
}

export const ZERO_BHD: Money = money(0);

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new TypeError(`Cannot combine different currencies: ${a.currency} and ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

/** `factor` is always an integer quantity in this codebase (line total = unit price × quantity), so simple rounding is never a precision hazard. */
export function multiply(a: Money, factor: number): Money {
  return money(Math.round(a.amount * factor), a.currency);
}

export function sum(amounts: readonly Money[], currency: CurrencyCode = ACTIVE_CURRENCY.code): Money {
  return amounts.reduce((total, m) => add(total, m), money(0, currency));
}

export function isZero(a: Money): boolean {
  return a.amount === 0;
}

export function isPositive(a: Money): boolean {
  return a.amount > 0;
}

export function isNegative(a: Money): boolean {
  return a.amount < 0;
}

/** `-1` if `a < b`, `0` if equal, `1` if `a > b`. */
export function compare(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return Math.sign(a.amount - b.amount);
}

export function isGreaterThan(a: Money, b: Money): boolean {
  return compare(a, b) > 0;
}

export function isGreaterThanOrEqual(a: Money, b: Money): boolean {
  return compare(a, b) >= 0;
}

export function isLessThan(a: Money, b: Money): boolean {
  return compare(a, b) < 0;
}

export function isLessThanOrEqual(a: Money, b: Money): boolean {
  return compare(a, b) <= 0;
}

export function max(a: Money, b: Money): Money {
  return isGreaterThanOrEqual(a, b) ? a : b;
}

export function min(a: Money, b: Money): Money {
  return isLessThanOrEqual(a, b) ? a : b;
}

/** `percent` is a whole-number percentage (e.g. `15` for 15%), rounded to the nearest minor unit — used by percentage-off coupons/promotions (`core/pricing/discount-engine.ts`), never a general-purpose float multiplier. */
export function percentageOf(a: Money, percent: number): Money {
  return money(Math.round((a.amount * percent) / 100), a.currency);
}

/** Never returns a negative amount — used for "how much more until free shipping" style differences. */
export function positiveDifference(a: Money, b: Money): Money {
  const diff = subtract(a, b);
  return isPositive(diff) ? diff : money(0, a.currency);
}

/**
 * `"BHD 18.990"` for BHD. Locale-agnostic and deliberately plain (no
 * `Intl.NumberFormat` grouping/symbol quirks to fight with across locales)
 * — good enough for Phase 5's single-currency, single-market scope; a
 * richer locale-aware formatter is future work if a second market needs it.
 */
export function formatMoney(m: Money, definition: CurrencyDefinition = ACTIVE_CURRENCY): string {
  const majorUnits = m.amount / definition.minorUnitsPerMajor;
  return `${definition.code} ${majorUnits.toFixed(definition.decimalDigits)}`;
}

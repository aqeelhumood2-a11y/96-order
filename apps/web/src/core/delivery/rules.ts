import type { DeliveryAddress } from "./entities";

/**
 * Bahrain is Phase 5's only supported delivery country — enforced here,
 * not by `DeliveryAddress.country`'s type (a plain string), so a future
 * second country is an addition to this list, not a schema change.
 */
export const SUPPORTED_DELIVERY_COUNTRIES = ["BH"] as const;

export function isSupportedDeliveryCountry(country: string): boolean {
  return (SUPPORTED_DELIVERY_COUNTRIES as readonly string[]).includes(country);
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Server-side validation for a submitted `DeliveryAddress` — never trust that the browser only ever sent a supported country or filled-in required fields. */
export function isValidDeliveryAddress(address: DeliveryAddress): boolean {
  return (
    isSupportedDeliveryCountry(address.country) &&
    nonEmpty(address.area) &&
    nonEmpty(address.block) &&
    nonEmpty(address.road) &&
    nonEmpty(address.building)
  );
}

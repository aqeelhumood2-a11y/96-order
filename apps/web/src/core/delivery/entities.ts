/**
 * `country` is a free string (an ISO 3166-1 alpha-2 code in practice, e.g.
 * `"BH"`) rather than a fixed union — Bahrain is Phase 5's only supported
 * delivery country (enforced by `core/delivery/rules.ts`'s validation, not
 * by the type system), but the address shape itself never needs to change
 * to support a second country later. Bahrain addresses don't use postal
 * codes/street names the way many countries do, hence `area`/`block`/
 * `road`/`building`/`flat` instead of a generic `street`/`city`/`zip` —
 * still a plain optional-heavy bag of strings, so a future country's
 * different address shape is additive fields, not a redesign.
 */
export interface DeliveryAddress {
  country: string;
  area: string;
  block: string;
  road: string;
  building: string;
  flat?: string;
  landmark?: string;
  /** Optional map-pin seam — no map picker UI ships in Phase 5, but the field exists so one can be added without an address-shape change. */
  coordinates?: { lat: number; lng: number };
  instructions?: string;
}

/**
 * A single placeholder pickup location is configured via env/code in
 * Phase 5 (see `config/pickup.ts`) — `locationId`/`locationName` are
 * snapshotted onto the order at checkout time so a later rename or
 * removal of the location never rewrites order history. The future admin
 * configuration path (multiple locations, per-location hours) is a
 * `pickupLocations` Firestore collection this same shape already fits.
 */
export interface PickupSelection {
  locationId: string;
  locationName: string;
  locationAddress: string;
  instructions?: string;
}

export const FULFILLMENT_METHODS = ["delivery", "pickup"] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

/** One shared shape for both delivery and pickup scheduling — see `core/scheduling/rules.ts`. */
export interface FulfillmentSchedule {
  /** ISO `yyyy-mm-dd`. */
  date: string;
  /** One of `core/scheduling/rules.ts`'s `TIME_WINDOWS`, e.g. `"10:00-12:00"`. */
  timeWindow: string;
}

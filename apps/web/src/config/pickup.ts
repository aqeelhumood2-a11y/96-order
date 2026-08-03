/**
 * A single placeholder pickup location, configured here via env/code
 * rather than a Firestore document — see
 * `core/delivery/entities.ts#PickupSelection`'s doc comment for the future
 * admin-configurable `pickupLocations` collection this same shape already
 * fits without a redesign. Deliberately untyped against `PickupSelection`
 * itself (a `core` type) — `config` stays a leaf layer nothing else needs
 * to depend on core to read from; the shape still matches structurally.
 */
export const PICKUP_LOCATION = {
  locationId: process.env.PICKUP_LOCATION_ID ?? "main-roastery",
  locationName: process.env.PICKUP_LOCATION_NAME ?? "Ninety Six Degrees Cafe Roastery",
  locationAddress: process.env.PICKUP_LOCATION_ADDRESS ?? "Building 96, Road 96, Block 96, Manama, Bahrain",
};

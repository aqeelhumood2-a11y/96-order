import type { DeliveryAddress } from "@/core/delivery/entities";

/**
 * `"custom"` pairs with `customLabel` (a free-text label the customer
 * types); the other three are fixed presets covering the address kinds
 * README's spec calls out by name for this coffee/equipment storefront's
 * Bahrain customer base (a "farm" delivery address is a real, common case
 * for a wholesale-leaning coffee customer, not a generic placeholder).
 */
export const ADDRESS_LABELS = ["home", "work", "farm", "custom"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

/**
 * Reuses `core/delivery/entities.ts#DeliveryAddress` verbatim for the
 * physical-address fields — the exact shape Phase 5's checkout already
 * validates and stores per order, so a saved address can pre-fill
 * checkout without any field-mapping. `recipientName`/`recipientMobile`
 * are this address's own contact (may differ from the account holder —
 * e.g. a gift address), kept separate from `DeliveryAddress` itself since
 * an order's contact is a checkout-time concept, not a property of the
 * address book entry.
 */
export interface CustomerAddress {
  id: string;
  customerUid: string;
  label: AddressLabel;
  customLabel?: string;
  recipientName: string;
  recipientMobile: string;
  address: DeliveryAddress;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

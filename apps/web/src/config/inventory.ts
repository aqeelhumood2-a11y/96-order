/**
 * Reservation TTL configuration — see README's Stock reservation lifecycle
 * section. Both are backstops, not the primary release mechanism for their
 * payment method:
 *
 * - `tap`: reservations expire roughly in line with how long a shopper is
 *   realistically still completing an in-progress Tap payment session. If
 *   the payment never completes, the reservation is lazily reclaimed (see
 *   `FirestoreInventoryReservationRepository.reserve`) the next time
 *   someone else tries to reserve the same product/variant.
 * - `cash`: cash on delivery/pickup orders are *intentionally* held far
 *   longer, because the real release/commit event for cash is an
 *   authorized admin action (confirming receipt), not automatic expiry —
 *   this longer window only guards against an order that's abandoned
 *   entirely and never followed up on.
 */
export const RESERVATION_EXPIRY_MS = {
  tap: 30 * 60 * 1000,
  cash: 7 * 24 * 60 * 60 * 1000,
} as const;

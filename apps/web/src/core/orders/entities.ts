import type { CurrencyCode, Money } from "@/core/money/money";
import type { DeliveryAddress, FulfillmentMethod, FulfillmentSchedule, PickupSelection } from "@/core/delivery/entities";
import type { PaymentMethod, PaymentStatus } from "@/core/payments/entities";
import type { AppliedDiscount } from "@/core/pricing/apply-discounts";

/**
 * Only the statuses actually reachable during Phase 5's checkout flow are
 * ever set by this phase's own code (`pending_payment`, `confirmed`,
 * `cancelled`) — the rest (`preparing`/`ready`/`out_for_delivery`/
 * `completed`) are modeled now so Phase 6's admin order-management screen
 * has a stable enum to build against, not something this phase transitions
 * an order through itself. See README's Order statuses section.
 */
export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Collected once at checkout, never edited through a public route
 * afterward. `mobile` is stored in its normalized `+973XXXXXXXX` form
 * (see `core/customer/phone.ts`) — never the shopper's raw input.
 */
export interface OrderCustomerSnapshot {
  fullName: string;
  mobile: string;
  email: string;
  companyName?: string;
  note?: string;
}

/**
 * A fully resolved, server-trusted line — every field here is copied from
 * live catalog data *at the moment the order was placed*, never from
 * anything the browser sent directly. This is what "order history must
 * survive a later price/name change to the product" means: the order
 * keeps its own permanent copy.
 */
export interface OrderLine {
  productId: string;
  variantId: string | null;
  productName: string;
  variantAttributes?: Record<string, string>;
  sku: string;
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface OrderDeliveryFulfillment {
  method: "delivery";
  address: DeliveryAddress;
  schedule: FulfillmentSchedule;
}

export interface OrderPickupFulfillment {
  method: "pickup";
  pickup: PickupSelection;
  schedule: FulfillmentSchedule;
}

export type OrderFulfillment = OrderDeliveryFulfillment | OrderPickupFulfillment;

export function fulfillmentMethodOf(fulfillment: OrderFulfillment): FulfillmentMethod {
  return fulfillment.method;
}

export interface Order {
  /** Internal Firestore document id — never shown to a customer; see `orderNumber` for the public-facing identifier. */
  id: string;
  orderNumber: string;
  customer: OrderCustomerSnapshot;
  fulfillment: OrderFulfillment;
  lines: OrderLine[];
  subtotal: Money;
  /** The fee actually charged — already reflects a `"free_shipping"` coupon/promotion, if one applied. See `couponCode`/`appliedDiscounts` for what produced `discountTotal`/this. */
  shippingFee: Money;
  discountTotal: Money;
  grandTotal: Money;
  /**
   * Phase 7: the coupon redeemed for this order, if any. Optional (not
   * `| null` alone) for the same reason `customerId` above is optional —
   * every Phase 5/6 order predates this field and is never migrated;
   * treat a missing value the same as `null`, never as "unknown".
   * Persisted so a later coupon edit/deactivation can never change what
   * this order already shows was charged.
   */
  couponCode?: string | null;
  /** Phase 7: an immutable snapshot of every promotion/coupon discount applied at checkout — same "the order keeps its own permanent copy" principle `OrderLine`'s doc comment describes for catalog data. Optional for the same pre-Phase-7-order reason as `couponCode`. */
  appliedDiscounts?: AppliedDiscount[];
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  /** Always `"web"` in Phase 5 — reserved for a future POS/wholesale source value without a schema change. */
  source: "web";
  /** The checkout submission's idempotency key — see `services/checkout/*` and README's Idempotency section. */
  idempotencyKey: string;
  /**
   * Phase 6: the id of this order's `Customer` aggregate (see
   * `core/customer/entities.ts`), always set — every order has a customer
   * record, guest or not (see `Customer.kind`). Optional only so a
   * `FirestoreOrderRepository` document written before this field existed
   * still deserializes; never absent on an order created by Phase 6 code.
   */
  customerId?: string;
  /**
   * Phase 6: denormalized admin search index — see
   * `core/orders/rules.ts#buildOrderSearchTokens` and README's Order search
   * strategy section. Never accepted from client input; recomputed
   * server-side whenever an order is created.
   */
  searchTokens?: string[];
  /** Bumped on every status transition — an optimistic-concurrency guard, and the seam a future full status-history view reads alongside `orderEvents`. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

/** Append-only status-change ledger — `orderEvents` collection. Mirrors Phase 3's `InventoryAdjustment` ledger pattern (create-only, never edited). */
export interface OrderStatusEvent {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  /** A staff uid, or a fixed system actor id (e.g. `"system:checkout"`, `"system:tap_webhook"`) — always server-set, never client-supplied. */
  actorId: string;
  note?: string;
  createdAt: Date;
}

/** A new status event to be recorded — `id`/`createdAt` are assigned by the repository, mirroring `NewAuditLogEntry`. */
export type NewOrderStatusEvent = Omit<OrderStatusEvent, "id" | "createdAt">;

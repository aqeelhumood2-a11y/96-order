import type { Session } from "@/core/auth/entities";
import type { Order } from "@/core/orders/entities";
import { changeOrderStatus } from "./change-order-status";
import { defaultOrderManagementDeps, type OrderManagementDeps } from "./dependencies";

/**
 * Named, single-purpose wrappers over `change-order-status.ts`'s generic
 * engine — one per README's Order Actions list, so the admin UI (and its
 * Server Actions) calls something self-explanatory
 * (`markPreparingAction` on a button, not a raw status string) while every
 * one of these still shares the exact same permission/transition/
 * side-effect enforcement underneath. `confirmCashPayment` (Phase 5's
 * `services/payments/confirm-cash-payment.ts`) and `confirmOrderPayment`
 * (this phase's manual `tap` override, `confirm-order-payment.ts`) are
 * deliberately not here — both do more than a status transition (they
 * touch `Payment`/`paymentStatus` first), so they stay their own use
 * cases and call into `changeOrderStatus` only for the `confirmed` move
 * where relevant.
 */
export function cancelOrder(actor: Session, orderId: string, expectedVersion: number, note?: string, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  return changeOrderStatus(actor, { orderId, toStatus: "cancelled", expectedVersion, note }, deps);
}

export function markPreparing(actor: Session, orderId: string, expectedVersion: number, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  return changeOrderStatus(actor, { orderId, toStatus: "preparing", expectedVersion }, deps);
}

export function markReady(actor: Session, orderId: string, expectedVersion: number, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  return changeOrderStatus(actor, { orderId, toStatus: "ready", expectedVersion }, deps);
}

/** Dispatches a delivery order to the courier — only valid for a `delivery` fulfillment (see `changeOrderStatus`'s guard). */
export function markOutForDelivery(actor: Session, orderId: string, expectedVersion: number, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  return changeOrderStatus(actor, { orderId, toStatus: "out_for_delivery", expectedVersion }, deps);
}

/**
 * The single "this order is done" action — README's "Mark delivered" (a
 * courier-confirmed delivery order, `out_for_delivery -> completed`) and
 * "Complete order" (a picked-up pickup order, `ready -> completed`) are
 * the same underlying transition target; which starting status is valid
 * depends only on the order's own fulfillment method, already enforced by
 * `core/orders/rules.ts#isValidOrderStatusTransition`. The admin UI labels
 * the button "Mark delivered" or "Complete order" based on
 * `order.fulfillment.method` — both call this one function.
 */
export function completeOrder(actor: Session, orderId: string, expectedVersion: number, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<Order> {
  return changeOrderStatus(actor, { orderId, toStatus: "completed", expectedVersion }, deps);
}

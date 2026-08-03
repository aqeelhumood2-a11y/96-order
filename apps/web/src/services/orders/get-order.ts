import type { Session } from "@/core/auth/entities";
import type { InventoryReservation } from "@/core/catalog/entities";
import { NotFoundError } from "@/core/errors";
import type { Order, OrderStatusEvent } from "@/core/orders/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultOrderManagementDeps, type OrderManagementDeps } from "./dependencies";

export interface OrderDetail {
  order: Order;
  /** Status-change ledger, oldest first — the admin order-detail "status timeline"/"audit history" panel. */
  events: OrderStatusEvent[];
  /** This order's own inventory reservation rows — the "inventory reservation status" panel (reserved/released/committed per line). */
  reservations: InventoryReservation[];
}

/** Fetches everything the admin order-detail screen needs in one call: the order itself, its status-change ledger, and its inventory reservation state. */
export async function getOrder(actor: Session, orderId: string, deps: OrderManagementDeps = defaultOrderManagementDeps): Promise<OrderDetail> {
  requirePermission(actor, "orders:view");

  const order = await deps.orders.findById(orderId);
  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  const [events, reservations] = await Promise.all([deps.orderEvents.listByOrder(orderId), deps.inventory.reservations.listByOrder(orderId)]);

  return { order, events: [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()), reservations };
}

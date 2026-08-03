import type { CustomerSession } from "@/core/customer-auth/entities";
import { customerKeyFromEmail } from "@/core/customer/rules";
import { NotFoundError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { FirestoreOrderRepository } from "@/infrastructure/firebase/repositories/firestore-order-repository";
import type { OrderRepository } from "@/core/interfaces/order-repository";

const ORDER_HISTORY_LIMIT = 100;

/**
 * A customer's own order history — keyed the same way admin's
 * `services/customers/get-customer.ts` looks up a customer's orders
 * (`customerKeyFromEmail`), scoped to the signed-in session's own email
 * so a customer can never pass an arbitrary id to see someone else's
 * orders. This is what makes guest-order linking automatic: every past
 * guest order under this exact (now-verified) email is already tagged
 * with this same `customerId` at checkout time — see
 * `services/customer-auth/link-guest-orders.ts`'s doc comment.
 */
export async function listMyOrders(session: CustomerSession, orders: OrderRepository = new FirestoreOrderRepository()): Promise<Order[]> {
  const customerId = customerKeyFromEmail(session.email);
  return orders.listByCustomer(customerId, ORDER_HISTORY_LIMIT);
}

/** A single order, only if it belongs to the signed-in customer's own email — never trusts an order id/number alone as proof of ownership. */
export async function getMyOrder(session: CustomerSession, orderNumber: string, orders: OrderRepository = new FirestoreOrderRepository()): Promise<Order> {
  const order = await orders.findByOrderNumber(orderNumber);
  if (!order || order.customer.email.trim().toLowerCase() !== session.email) {
    throw new NotFoundError("Order not found.");
  }
  return order;
}

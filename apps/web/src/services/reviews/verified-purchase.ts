import { customerKeyFromEmail } from "@/core/customer/rules";
import type { OrderRepository } from "@/core/interfaces/order-repository";

const ORDER_LOOKUP_LIMIT = 100;

/** True only if a `"completed"` order under this email contains the product — never client-supplied, computed fresh at submission time. */
export async function hasVerifiedPurchase(email: string, productId: string, orders: OrderRepository): Promise<boolean> {
  const customerId = customerKeyFromEmail(email);
  const customerOrders = await orders.listByCustomer(customerId, ORDER_LOOKUP_LIMIT);
  return customerOrders.some((order) => order.status === "completed" && order.lines.some((line) => line.productId === productId));
}

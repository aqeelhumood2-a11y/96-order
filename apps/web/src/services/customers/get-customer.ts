import type { Session } from "@/core/auth/entities";
import type { Customer } from "@/core/customer/entities";
import { NotFoundError } from "@/core/errors";
import type { Order } from "@/core/orders/entities";
import { requirePermission } from "@/services/auth/session";
import { defaultCustomerManagementDeps, type CustomerManagementDeps } from "./dependencies";

const ORDER_HISTORY_LIMIT = 100;

export interface CustomerDetail {
  customer: Customer;
  /** Newest first — the "order history" panel on the customer-detail screen. */
  orders: Order[];
}

export async function getCustomer(actor: Session, customerId: string, deps: CustomerManagementDeps = defaultCustomerManagementDeps): Promise<CustomerDetail> {
  requirePermission(actor, "customers:view");

  const customer = await deps.customers.findById(customerId);
  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  const orders = await deps.orders.listByCustomer(customerId, ORDER_HISTORY_LIMIT);
  return { customer, orders };
}

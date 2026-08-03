import type { CustomerRepository } from "@/core/interfaces/customer-repository";
import { customerKeyFromEmail, nextCustomerOnOrderCreated } from "@/core/customer/rules";
import type { Customer } from "@/core/customer/entities";
import type { Money } from "@/core/money/money";
import type { OrderCustomerSnapshot } from "@/core/orders/entities";

/**
 * Folds a newly created order into its customer aggregate — called once
 * from `services/checkout/create-order.ts` right after the order itself
 * is created, the same place that order's inventory reservation and
 * payment are set up. Not itself permission-gated: this always runs as
 * part of order creation (a system-initiated step, like
 * `reserveOrderLines`), never called directly from an admin action. See
 * `core/customer/entities.ts`'s doc comment for why `Customer.id` is the
 * normalized email rather than a generated id.
 */
export async function upsertCustomerFromOrder(
  customer: OrderCustomerSnapshot,
  grandTotal: Money,
  orderCreatedAt: Date,
  customers: CustomerRepository,
): Promise<Customer> {
  const customerId = customerKeyFromEmail(customer.email);
  return customers.upsert(customerId, (existing) => nextCustomerOnOrderCreated(existing, { customer, grandTotal, orderCreatedAt }));
}

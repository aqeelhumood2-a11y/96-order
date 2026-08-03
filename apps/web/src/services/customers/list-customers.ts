import type { Session } from "@/core/auth/entities";
import type { Customer } from "@/core/customer/entities";
import { customerMatchesAllQueryWords, tokenizeCustomerSearchQuery } from "@/core/customer/rules";
import type { ParsedListCustomersQuery } from "@/core/customer/schemas";
import type { Page } from "@/core/interfaces/repository";
import { requirePermission } from "@/services/auth/session";
import { defaultCustomerManagementDeps, type CustomerManagementDeps } from "./dependencies";

/** The admin customer list — same primary-token-plus-in-memory-refinement search strategy as `services/orders/list-orders.ts`; see its doc comment. */
export async function listCustomers(actor: Session, query: ParsedListCustomersQuery, deps: CustomerManagementDeps = defaultCustomerManagementDeps): Promise<Page<Customer>> {
  requirePermission(actor, "customers:view");

  const words = query.search ? tokenizeCustomerSearchQuery(query.search) : [];
  const [primaryWord] = [...words].sort((a, b) => b.length - a.length);

  const page = await deps.customers.list({ limit: query.limit, cursor: query.cursor, search: primaryWord });

  const remainingWords = words.filter((word) => word !== primaryWord);
  if (remainingWords.length === 0) {
    return page;
  }
  return { items: page.items.filter((customer) => customerMatchesAllQueryWords(customer, remainingWords)), nextCursor: page.nextCursor };
}

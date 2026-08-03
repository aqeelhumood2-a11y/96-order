import type { Customer } from "@/core/customer/entities";
import type { Page, PageRequest } from "./repository";

export interface ListCustomersRequest extends PageRequest {
  search?: string;
}

/**
 * Port for the derived `customers` collection (see `core/customer/entities.ts`'s
 * doc comment for why it's keyed by normalized email rather than a
 * generated id). `upsertFromOrder` is the one write path — there is no
 * generic `create`/`update` here, the same "the repository owns its own
 * mutation transaction" shape `InventoryRepository.adjust()` uses, because
 * folding an order into the aggregate must read-modify-write atomically
 * (two orders from the same brand-new customer arriving concurrently must
 * never both see `existing: null` and each create a `totalOrders: 1`
 * customer, clobbering one another).
 */
export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  list(request: ListCustomersRequest): Promise<Page<Customer>>;
  /**
   * Reads the current customer (if any), applies `fold`, and writes the
   * result back inside one Firestore transaction — `fold` is a pure
   * function (see `core/customer/rules.ts#nextCustomerOnOrderCreated`/
   * `reverseCancelledOrderSpend`) so this method's own job is only the
   * transactional read-modify-write, never the business math.
   */
  upsert(customerId: string, fold: (existing: Customer | null) => Customer): Promise<Customer>;
}

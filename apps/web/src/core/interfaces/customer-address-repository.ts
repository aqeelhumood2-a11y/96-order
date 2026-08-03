import type { CustomerAddress } from "@/core/customer-address/entities";

export interface CustomerAddressRepository {
  listByCustomer(customerUid: string): Promise<CustomerAddress[]>;
  findById(id: string): Promise<CustomerAddress | null>;
  create(address: CustomerAddress): Promise<void>;
  update(id: string, patch: Partial<CustomerAddress>): Promise<void>;
  delete(id: string): Promise<void>;
  /** Transactionally clears `isDefault` on every other address for this customer before setting it on `addressId` — never two defaults at once. */
  setDefault(customerUid: string, addressId: string): Promise<void>;
}

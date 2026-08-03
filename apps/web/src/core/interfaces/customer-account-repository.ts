import type { CustomerAccount } from "@/core/customer-auth/entities";

/** Port for the `customerAccounts/{uid}` collection — see `CustomerAccount`'s doc comment for why this is a separate collection from `customers/{email}` (Phase 6's order-derived aggregate). */
export interface CustomerAccountRepository {
  findByUid(uid: string): Promise<CustomerAccount | null>;
  findByEmail(email: string): Promise<CustomerAccount | null>;
  create(account: CustomerAccount): Promise<void>;
  update(uid: string, patch: Partial<CustomerAccount>): Promise<void>;
}

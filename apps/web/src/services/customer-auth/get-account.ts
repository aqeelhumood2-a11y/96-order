import type { CustomerAccount, CustomerSession } from "@/core/customer-auth/entities";
import { NotFoundError } from "@/core/errors";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

/** The full account document for the signed-in session — `CustomerSession` only carries the fields cheap enough to resolve on every request; pages needing mobile/preferences/consent fetch the whole thing here. */
export async function getMyAccount(session: CustomerSession, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<CustomerAccount> {
  const account = await deps.accounts.findByUid(session.uid);
  if (!account) {
    throw new NotFoundError("Account not found.");
  }
  return account;
}

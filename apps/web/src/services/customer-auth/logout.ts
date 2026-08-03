import type { CustomerSession } from "@/core/customer-auth/entities";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

export async function logoutCustomer(session: CustomerSession, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  await deps.auditLogs.record({ type: "customer_logged_out", actorUid: session.uid, actorEmail: session.email, metadata: {} });
}

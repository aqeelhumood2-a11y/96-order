import { customerKeyFromEmail } from "@/core/customer/rules";
import { defaultCustomerAuthDeps, type CustomerAuthDeps } from "./dependencies";

/**
 * README's Guest Order Linking requirement — called only once an
 * account's email has actually been verified (`verify-email.ts`), never
 * on registration alone. Because Phase 6 already keys every order's
 * `customerId` (and the `customers/{email}` aggregate's own id) by
 * normalized email, "linking" needs no data migration or per-order
 * claim step at all: the moment this account's email is verified, every
 * past guest order under that exact email is already reachable through
 * `OrderRepository.listByCustomer(customerId)` with `customerId =
 * customerKeyFromEmail(email)` — the same key a registered customer's
 * own account uses. This function's only real job is updating the
 * `Customer` aggregate's `kind`/`userId` so admin/customer UI can show
 * "registered" instead of "guest," and recording the audit event.
 * Idempotent: re-verifying (shouldn't happen, but harmless if it does)
 * just re-sets the same fields.
 */
export async function linkGuestOrders(uid: string, email: string, deps: CustomerAuthDeps = defaultCustomerAuthDeps): Promise<void> {
  const customerId = customerKeyFromEmail(email);
  const existing = await deps.customers.findById(customerId);
  if (!existing) {
    // No guest orders under this email yet — nothing to link. The
    // customer aggregate is created lazily by the first order anyway
    // (`services/customers/upsert-customer-from-order.ts`), so there's
    // nothing to pre-create here.
    return;
  }

  const hadPriorOrders = existing.kind !== "registered";
  await deps.customers.upsert(customerId, (current) => {
    if (!current) throw new Error(`Customer record ${customerId} disappeared mid-link.`);
    return { ...current, kind: "registered", userId: uid, updatedAt: new Date() };
  });

  if (hadPriorOrders && existing.totalOrders > 0) {
    await deps.auditLogs.record({ type: "guest_orders_linked", actorUid: uid, actorEmail: email, metadata: { customerId, orderCount: existing.totalOrders } });
  }
}

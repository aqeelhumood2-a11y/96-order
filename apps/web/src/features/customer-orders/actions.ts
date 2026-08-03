"use server";

import { getOrCreateCartId } from "@/services/cart/cart-session";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { reorderMyOrder, type ReorderResult } from "@/services/customer-orders/reorder";

export async function reorderAction(orderNumber: string): Promise<ActionResult<ReorderResult>> {
  return runAction(async () => {
    const session = await requireCustomerSession();
    const cartId = await getOrCreateCartId();
    return reorderMyOrder(session, orderNumber, cartId);
  });
}

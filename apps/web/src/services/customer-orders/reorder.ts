import { addToCart } from "@/services/cart/add-to-cart";
import type { CartDeps } from "@/services/cart/dependencies";
import { defaultCartDeps } from "@/services/cart/dependencies";
import { getMyOrder } from "./list-my-orders";
import type { CustomerSession } from "@/core/customer-auth/entities";

export interface ReorderResult {
  addedCount: number;
  skippedCount: number;
}

/**
 * Adds every line of a past order back to the current (guest-cookie)
 * cart, one `addToCart` call per line — never trusts the order's own
 * frozen price/name snapshot, since `addToCart` always revalidates
 * against *live* catalog/inventory data (see its doc comment). A line
 * whose product was archived, hidden, or is now out of stock is simply
 * skipped rather than failing the whole reorder — a customer with a
 * 5-item order shouldn't lose all 5 because one is discontinued.
 */
export async function reorderMyOrder(session: CustomerSession, orderNumber: string, cartId: string, deps: CartDeps = defaultCartDeps): Promise<ReorderResult> {
  const order = await getMyOrder(session, orderNumber);

  let addedCount = 0;
  let skippedCount = 0;
  for (const line of order.lines) {
    try {
      await addToCart({ cartId, productId: line.productId, variantId: line.variantId, quantity: line.quantity }, deps);
      addedCount += 1;
    } catch {
      skippedCount += 1;
    }
  }

  return { addedCount, skippedCount };
}

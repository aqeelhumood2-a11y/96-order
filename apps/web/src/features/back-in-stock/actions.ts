"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/action-result";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { unsubscribeMyBackInStock } from "@/services/back-in-stock/unsubscribe";

/** Subscribing is a Route Handler (`/api/back-in-stock/subscribe`), not a Server Action — it needs the request's IP for rate limiting, same reasoning as every other customer-auth endpoint (see `app/api/customer-auth/*`). */
export async function unsubscribeMyBackInStockAction(subscriptionId: string): Promise<ActionResult<null>> {
  const result = await runAction(async () => {
    const session = await requireCustomerSession();
    await unsubscribeMyBackInStock(session, subscriptionId);
    return null;
  });
  if (result.ok) revalidatePath("/account/notifications");
  return result;
}

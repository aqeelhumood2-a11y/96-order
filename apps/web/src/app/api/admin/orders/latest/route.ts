import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { listOrdersQuerySchema } from "@/core/orders/schemas";
import { requireSession } from "@/services/auth/session";
import { listOrders } from "@/services/orders/list-orders";

export const dynamic = "force-dynamic";

/**
 * Polled by `NewOrderAlert` (admin shell) to detect a newly placed order so
 * it can play a sound, and to know whether any order is still sitting
 * `confirmed` (placed, paid, but not yet accepted by staff) so that sound
 * can keep repeating until someone deals with it, not just chime once and
 * risk being missed. `listOrders` itself enforces `orders:view`, so a staff
 * member without it gets the same 403 every other order-management surface
 * already gives them.
 */
export async function GET() {
  try {
    const actor = await requireSession();
    const [latestPage, pendingAcceptancePage] = await Promise.all([
      listOrders(actor, listOrdersQuerySchema.parse({ limit: 1 })),
      listOrders(actor, listOrdersQuerySchema.parse({ limit: 1, status: "confirmed" })),
    ]);
    return NextResponse.json({
      latestOrderId: latestPage.items[0]?.id ?? null,
      hasOrdersAwaitingAcceptance: pendingAcceptancePage.items.length > 0,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

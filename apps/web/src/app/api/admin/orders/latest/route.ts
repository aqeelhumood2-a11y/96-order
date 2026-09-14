import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { listOrdersQuerySchema } from "@/core/orders/schemas";
import { requireSession } from "@/services/auth/session";
import { listOrders } from "@/services/orders/list-orders";

export const dynamic = "force-dynamic";

/**
 * Polled by `NewOrderAlert` (admin shell) to detect a newly placed order so
 * it can play a sound — deliberately returns just the one id the client
 * needs to notice "this is a different order than last time", not a full
 * order representation. `listOrders` itself enforces `orders:view`, so a
 * staff member without it gets the same 403 every other order-management
 * surface already gives them.
 */
export async function GET() {
  try {
    const actor = await requireSession();
    const query = listOrdersQuerySchema.parse({ limit: 1 });
    const page = await listOrders(actor, query);
    return NextResponse.json({ latestOrderId: page.items[0]?.id ?? null });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { requireSession } from "@/services/auth/session";
import { confirmCashPayment } from "@/services/payments/confirm-cash-payment";

/**
 * The minimal protected admin action Phase 5 needs to validate the cash
 * order lifecycle end-to-end — `confirmCashPayment` itself is what
 * actually enforces `payments:manage`, idempotency, and the state
 * transition; this route is only the thin Next.js entry point into it. A
 * full order-management screen (listing, filtering, bulk actions) belongs
 * to Phase 6.
 */
export async function POST(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const actor = await requireSession();
    const { orderId } = await context.params;
    const order = await confirmCashPayment(actor, orderId);
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { subscribeBackInStockSchema } from "@/core/back-in-stock/schemas";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { getCustomerSession } from "@/services/customer-auth/session";
import { subscribeToBackInStock } from "@/services/back-in-stock/subscribe";

/** Guests and signed-in customers share this one endpoint — see `subscribeToBackInStock`'s doc comment. */
export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
  }

  const parsed = subscribeBackInStockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const session = await getCustomerSession();
    const subscription = await subscribeToBackInStock({
      email: session?.email ?? parsed.data.email,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      ip: getClientIp(request),
      customerUid: session?.uid,
    });
    return NextResponse.json({ ok: true, id: subscription.id });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

import { NextResponse } from "next/server";
import { ORDER_SYNC_DEFAULT_WINDOW_HOURS } from "@/config/jobs";
import { verifyJobSecret } from "@/lib/verify-job-secret";
import { getOrderSyncFeed } from "@/services/integrations/daily-order-sync";

export const dynamic = "force-dynamic";

/**
 * Polled by an external ERP/inventory system — `?from=`/`?to=` (ISO 8601)
 * are optional and default to the last `ORDER_SYNC_DEFAULT_WINDOW_HOURS`
 * hours, i.e. safe to call with no params once a day. See
 * `lib/verify-job-secret.ts` for auth and `services/integrations/daily-order-sync.ts`
 * for the response shape and its stability guarantee.
 */
export async function GET(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Missing or invalid integration credentials." }, { status: 401 });
  }

  const url = new URL(request.url);
  const toParam = url.searchParams.get("to");
  const fromParam = url.searchParams.get("from");

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - ORDER_SYNC_DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);

  if (Number.isNaN(to.getTime()) || Number.isNaN(from.getTime())) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "`from`/`to` must be valid ISO 8601 timestamps." }, { status: 400 });
  }

  const feed = await getOrderSyncFeed(from, to);
  return NextResponse.json(feed);
}

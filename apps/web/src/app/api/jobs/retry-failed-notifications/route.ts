import { NextResponse } from "next/server";
import { verifyJobSecret } from "@/lib/verify-job-secret";
import { retryFailedNotifications } from "@/services/back-in-stock/retry-failed-notifications";

export const dynamic = "force-dynamic";

/** Invoke on a schedule (e.g. every 15 minutes) — see `lib/verify-job-secret.ts` and `services/back-in-stock/retry-failed-notifications.ts`. */
export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Missing or invalid job credentials." }, { status: 401 });
  }

  const result = await retryFailedNotifications();
  return NextResponse.json({ ok: true, ...result });
}

import { NextResponse } from "next/server";
import { verifyJobSecret } from "@/lib/verify-job-secret";
import { retryFailedEmails } from "@/services/email/retry-failed-emails";

export const dynamic = "force-dynamic";

/** Invoke on a schedule (e.g. every 15 minutes) from Cloud Scheduler or similar — see `lib/verify-job-secret.ts`. */
export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Missing or invalid job credentials." }, { status: 401 });
  }

  const result = await retryFailedEmails();
  return NextResponse.json({ ok: true, ...result });
}

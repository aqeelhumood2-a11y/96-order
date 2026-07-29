import { NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/core/errors";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { requestPasswordReset } from "@/services/auth/request-password-reset";

const bodySchema = z.object({ email: z.string().email() });

/**
 * Rate-limits, audit-logs, and triggers delivery of a forgot-password
 * request entirely server-side (see request-password-reset.ts). Always
 * responds `{ ok: true }` on valid input, regardless of whether the
 * account exists — never returns a reset link or any other detail.
 */
export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await requestPasswordReset({ email: parsed.data.email, ip: getClientIp(request) });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ ok: true });
}

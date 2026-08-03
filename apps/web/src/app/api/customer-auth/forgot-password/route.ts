import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { requestCustomerPasswordReset } from "@/services/customer-auth/request-password-reset";
import { requestPasswordResetSchema } from "@/core/customer-auth/schemas";

export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
  }

  const parsed = requestPasswordResetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid request." }, { status: 400 });
  }

  try {
    await requestCustomerPasswordReset({ email: parsed.data.email, ip: getClientIp(request) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

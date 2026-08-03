import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_EXPIRES_IN_MS } from "@/config/customer-auth";
import { registerCustomerSchema } from "@/core/customer-auth/schemas";
import { toErrorResponse } from "@/core/errors";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { loginCustomer } from "@/services/customer-auth/login";
import { registerCustomer } from "@/services/customer-auth/register";

/** Registers the account, then immediately logs in (mints a session cookie) — a customer who just created an account expects to already be signed in, not sent back to a login form. */
export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
  }

  const parsed = registerCustomerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const ip = getClientIp(request);
    await registerCustomer({ ...parsed.data, ip });
    const { cookie } = await loginCustomer({ email: parsed.data.email, password: parsed.data.password, ip });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(CUSTOMER_SESSION_EXPIRES_IN_MS / 1000),
    });
    return response;
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

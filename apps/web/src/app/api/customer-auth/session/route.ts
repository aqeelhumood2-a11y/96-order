import { NextResponse } from "next/server";
import { z } from "zod";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/config/customer-auth";
import { toErrorResponse } from "@/core/errors";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { loginCustomer } from "@/services/customer-auth/login";
import { logoutCustomer } from "@/services/customer-auth/logout";
import { getCustomerSession } from "@/services/customer-auth/session";

const bodySchema = z.object({ email: z.string().min(1), password: z.string().min(1) });

function forbiddenCrossSite() {
  return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
}

/** Customer login — mirrors `/api/auth/session` exactly, on the customer cookie/collection instead of staff. */
export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return forbiddenCrossSite();
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid request." }, { status: 400 });
  }

  try {
    const { cookie, expiresInMs } = await loginCustomer({ email: parsed.data.email, password: parsed.data.password, ip: getClientIp(request) });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });
    return response;
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return forbiddenCrossSite();
  }

  const session = await getCustomerSession();
  if (session) {
    await logoutCustomer(session);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

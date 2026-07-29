import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/config/auth";
import { toErrorResponse } from "@/core/errors";
import { verifySameOriginRequest } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { createSession } from "@/services/auth/create-session";
import { destroySession } from "@/services/auth/destroy-session";
import { getSession } from "@/services/auth/session";

const bodySchema = z.object({ idToken: z.string().min(1) });

function forbiddenCrossSite() {
  return NextResponse.json({ code: "FORBIDDEN", message: "Cross-site request blocked." }, { status: 403 });
}

/** Mints a server-managed session cookie from a Firebase ID token the client already obtained via direct sign-in. */
export async function POST(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return forbiddenCrossSite();
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid request." }, { status: 400 });
  }

  try {
    const { cookie, expiresInMs } = await createSession({ idToken: parsed.data.idToken, ip: getClientIp(request) });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, cookie, {
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

/** Clears the session cookie and records the logout; safe to call with no active session. */
export async function DELETE(request: Request) {
  if (!verifySameOriginRequest(request)) {
    return forbiddenCrossSite();
  }

  const session = await getSession();
  if (session) {
    await destroySession(session);
  }

  const response = NextResponse.json({ ok: true });
  // A `__Host-` prefixed cookie is only overwritten/cleared by a Set-Cookie
  // that itself satisfies the __Host- requirements (Secure, Path=/, no
  // Domain) — `.delete()` doesn't set Secure, so the browser silently
  // rejects it and the original cookie survives. `.set()` with maxAge: 0
  // and matching attributes is what actually clears it.
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

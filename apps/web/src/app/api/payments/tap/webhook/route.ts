import { NextResponse } from "next/server";
import { toErrorResponse } from "@/core/errors";
import { handleTapWebhook } from "@/services/payments/handle-tap-webhook";

/**
 * Tap calls this directly, server-to-server — no same-origin/CSRF check
 * applies here the way it does for browser-facing routes. The raw body is
 * read via `.text()` (never `.json()`) because signature verification
 * must run over the exact bytes Tap sent; re-serializing a parsed object
 * isn't guaranteed to reproduce the same bytes. Always responds with a
 * normal JSON body/status derived from whatever `handleTapWebhook` threw
 * (or `{ ok: true }` on success) — Tap only cares about the HTTP status.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-tap-signature");

  try {
    await handleTapWebhook(rawBody, signatureHeader);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

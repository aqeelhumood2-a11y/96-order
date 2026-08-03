import { NextResponse } from "next/server";
import { checkHealth } from "@/services/health/check-health";

export const dynamic = "force-dynamic";

/**
 * Unauthenticated by design — this is what a load balancer/uptime monitor
 * hits, and it deliberately returns only pass/fail booleans, never error
 * details, so it can't be used to fingerprint internals. See README's
 * Production checklist for how this wires into deployment health checks.
 */
export async function GET() {
  const result = await checkHealth();

  return NextResponse.json(
    { status: result.healthy ? "ok" : "degraded", timestamp: new Date().toISOString(), checks: result.checks },
    { status: result.healthy ? 200 : 503 },
  );
}

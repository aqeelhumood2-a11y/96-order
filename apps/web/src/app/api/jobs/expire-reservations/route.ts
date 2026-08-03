import { NextResponse } from "next/server";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { verifyJobSecret } from "@/lib/verify-job-secret";
import { expireReservations } from "@/services/inventory/expire-reservations";

export const dynamic = "force-dynamic";

/**
 * `expireReservations` (Phase 6) takes a real admin `Session` because it's
 * also callable as an admin action — `requirePermission` needs one to
 * check against. There's no logged-in admin behind a scheduled job, so
 * this constructs a synthetic system session carrying the reserved
 * `super_admin` role (which `hasPermission`/`isSuperAdmin` already bypass
 * every permission check for) purely to satisfy that signature — the same
 * "system:*" actor-identity convention `expireReservations` itself already
 * uses for `SWEEP_ACTOR` in its audit-log entries. Invoke on a schedule
 * (e.g. every 15 minutes) from Cloud Scheduler or similar — see
 * `lib/verify-job-secret.ts`.
 */
export async function POST(request: Request) {
  if (!verifyJobSecret(request)) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Missing or invalid job credentials." }, { status: 401 });
  }

  const systemActor = { uid: "system:reservation_sweep", email: "system@internal", roleIds: [SUPER_ADMIN_ROLE_ID], effectivePermissions: new Set<never>() };
  const result = await expireReservations(systemActor);
  return NextResponse.json({ ok: true, ...result });
}

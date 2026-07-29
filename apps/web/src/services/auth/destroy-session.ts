import type { Session } from "@/core/auth/entities";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Logout use case. Clearing the session cookie itself is a transport
 * concern handled by the Route Handler that calls this — this only records
 * the audit trail.
 */
export async function destroySession(session: Session, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  await deps.auditLogs.record({
    type: "logout",
    actorUid: session.uid,
    actorEmail: session.email,
    metadata: {},
  });
}

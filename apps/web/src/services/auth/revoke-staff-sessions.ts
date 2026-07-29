import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Force-logout: revokes a staff account's Firebase refresh tokens without
 * deactivating it, so their next request (or the next `checkRevoked`
 * verification) invalidates any already-minted session cookie immediately.
 */
export async function revokeStaffSessions(actor: Session, targetUid: string, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:edit");

  const target = await deps.users.findByUid(targetUid);
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  await deps.authSession.revokeRefreshTokens(targetUid);

  await deps.auditLogs.record({
    type: "session_revoked",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid,
    metadata: {},
  });
}

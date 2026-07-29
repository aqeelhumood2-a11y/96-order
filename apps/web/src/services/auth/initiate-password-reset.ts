import type { Session } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Admin-triggered password reset for an existing staff member (distinct
 * from the public, unauthenticated `request-password-reset` use case).
 * Triggers Firebase's hosted delivery server-side, the same as
 * `create-staff.ts` — no link is ever returned, logged, or shown in the
 * admin UI.
 */
export async function initiatePasswordReset(actor: Session, targetUid: string, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:edit");

  const target = await deps.users.findByUid(targetUid);
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  await deps.authSession.sendPasswordResetEmail(target.email);

  await deps.auditLogs.record({
    type: "password_reset_requested",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid,
    metadata: { initiatedByAdmin: true },
  });
}

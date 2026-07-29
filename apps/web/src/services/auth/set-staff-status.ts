import type { Session } from "@/core/auth/entities";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import type { StaffUserStatus } from "@/core/auth/entities";
import { NotFoundError } from "@/core/errors";
import { requirePermission } from "./session";
import { assertNotRemovingLastActiveSuperAdmin } from "./super-admin-guard";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Activates or deactivates a staff account. The *last* active super admin
 * can never be deactivated by anyone, including another super admin — this
 * is the "super admin cannot be stripped of required access" invariant,
 * scoped to prevent a total lockout rather than treating every super admin
 * account as permanently untouchable once more than one exists. Deactivating
 * also revokes the account's Firebase refresh tokens so it's force-logged-out
 * immediately, not just blocked from a future login.
 */
export async function setStaffStatus(
  actor: Session,
  targetUid: string,
  status: StaffUserStatus,
  deps: AuthDeps = defaultAuthDeps,
): Promise<void> {
  requirePermission(actor, "staff:edit");

  const target = await deps.users.findByUid(targetUid);
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  if (status === "deactivated" && target.roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    await assertNotRemovingLastActiveSuperAdmin(deps);
  }

  await deps.users.setStatus(targetUid, status, actor.uid);

  if (status === "deactivated") {
    await deps.authSession.revokeRefreshTokens(targetUid);
  }

  await deps.auditLogs.record({
    type: status === "active" ? "staff_activated" : "staff_deactivated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid,
    metadata: {},
  });
}

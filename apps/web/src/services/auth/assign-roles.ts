import type { Session } from "@/core/auth/entities";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "./session";
import { assertNotRemovingLastActiveSuperAdmin } from "./super-admin-guard";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Replaces a staff account's role assignments. Removing `super_admin` from
 * an account that holds it is only blocked when that account is the *last*
 * active super admin — see super-admin-guard.ts. With more than one active
 * super admin, any of them can have the role removed; only a total
 * lockout is prevented. There is still no demotion *flow* (approval,
 * re-auth, etc.) in Phase 2 — see Backlog — this only stops the specific
 * "zero super admins left" outcome.
 */
export async function assignRoles(actor: Session, targetUid: string, roleIds: string[], deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:edit");

  const target = await deps.users.findByUid(targetUid);
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  if (target.roleIds.includes(SUPER_ADMIN_ROLE_ID) && !roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    await assertNotRemovingLastActiveSuperAdmin(deps);
  }

  for (const roleId of roleIds) {
    const role = await deps.roles.findById(roleId);
    if (!role) {
      throw new ValidationError(`Role "${roleId}" does not exist.`);
    }
  }

  await deps.users.assignRoles(targetUid, roleIds);

  await deps.auditLogs.record({
    type: "staff_role_changed",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid,
    metadata: { roleIds },
  });
}

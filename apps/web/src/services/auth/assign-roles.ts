import type { Session } from "@/core/auth/entities";
import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Replaces a staff account's role assignments. A user currently holding the
 * `super_admin` role can never have it removed through this path — there is
 * no demotion flow in Phase 2 (see Backlog) — which is what makes "super
 * admin cannot be stripped of required access" an actual invariant rather
 * than a UI-only restriction.
 */
export async function assignRoles(actor: Session, targetUid: string, roleIds: string[], deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:edit");

  const target = await deps.users.findByUid(targetUid);
  if (!target) {
    throw new NotFoundError("Staff account not found.");
  }

  if (target.roleIds.includes(SUPER_ADMIN_ROLE_ID) && !roleIds.includes(SUPER_ADMIN_ROLE_ID)) {
    throw new ForbiddenError("The super_admin role cannot be removed from this account.");
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

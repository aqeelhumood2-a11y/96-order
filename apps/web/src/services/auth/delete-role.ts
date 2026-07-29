import type { Session } from "@/core/auth/entities";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/** System roles (`super_admin`) can never be deleted. */
export async function deleteRole(actor: Session, roleId: string, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:manage");

  const role = await deps.roles.findById(roleId);
  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be deleted.");
  }

  await deps.roles.delete(roleId);

  await deps.auditLogs.record({
    type: "role_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { roleId, deleted: true },
  });
}

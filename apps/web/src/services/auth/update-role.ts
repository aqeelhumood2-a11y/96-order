import type { Session } from "@/core/auth/entities";
import { isPermission, type Permission } from "@/core/auth/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * System roles (currently only `super_admin`) are entirely immutable
 * outside the bootstrap script — no field of a system role can be changed
 * through this use case, by anyone, regardless of permission level. This is
 * what makes "super admin cannot be stripped of required access" hold even
 * against a `staff:manage` holder who could otherwise edit any role.
 */
export async function updateRole(actor: Session, roleId: string, input: UpdateRoleInput, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:manage");

  const role = await deps.roles.findById(roleId);
  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be modified.");
  }

  let permissions: Permission[] | undefined;
  if (input.permissions) {
    const invalid = input.permissions.filter((permission) => !isPermission(permission));
    if (invalid.length > 0) {
      throw new ValidationError(`Unknown permission(s): ${invalid.join(", ")}.`);
    }
    permissions = input.permissions as Permission[];
  }

  await deps.roles.update(roleId, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(permissions !== undefined ? { permissions } : {}),
    updatedBy: actor.uid,
  });

  await deps.auditLogs.record({
    type: permissions !== undefined ? "permissions_changed" : "role_updated",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { roleId, ...input },
  });
}

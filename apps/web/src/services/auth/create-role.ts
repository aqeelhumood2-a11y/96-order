import type { Session } from "@/core/auth/entities";
import { isPermission, type Permission } from "@/core/auth/permissions";
import { ValidationError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface CreateRoleInput {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

function validatePermissions(permissions: string[]): Permission[] {
  const invalid = permissions.filter((permission) => !isPermission(permission));
  if (invalid.length > 0) {
    throw new ValidationError(`Unknown permission(s): ${invalid.join(", ")}.`);
  }
  return permissions as Permission[];
}

/**
 * Creates a custom role. Gated behind `staff:manage` — role administration
 * is core RBAC infrastructure, not a business module, so it doesn't get its
 * own permission namespace (see the Phase 2 README for this modeling call
 * and its accepted trust implications).
 */
export async function createRole(actor: Session, input: CreateRoleInput, deps: AuthDeps = defaultAuthDeps): Promise<void> {
  requirePermission(actor, "staff:manage");

  const existing = await deps.roles.findById(input.id);
  if (existing) {
    throw new ValidationError(`A role with id "${input.id}" already exists.`);
  }

  const permissions = validatePermissions(input.permissions);
  const now = new Date();

  await deps.roles.create({
    id: input.id,
    name: input.name,
    description: input.description,
    permissions,
    isSystemRole: false,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  });

  await deps.auditLogs.record({
    type: "role_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata: { roleId: input.id, permissions },
  });
}

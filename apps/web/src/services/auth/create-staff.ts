import type { Session } from "@/core/auth/entities";
import { ValidationError } from "@/core/errors";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface CreateStaffInput {
  email: string;
  displayName?: string;
  roleIds: string[];
}

export interface CreateStaffResult {
  uid: string;
  /** The one-time password-setup link, shown once to the creating admin — see request-password-reset.ts for why there's no automatic email delivery. */
  passwordResetLink: string;
}

/**
 * Creates a staff account. Staff can never self-register (there is no
 * public registration route) — this is the only way a new staff account
 * comes into existence, and it always requires `staff:create` (or
 * `staff:manage`, via the namespace wildcard).
 */
export async function createStaff(
  actor: Session,
  input: CreateStaffInput,
  deps: AuthDeps = defaultAuthDeps,
): Promise<CreateStaffResult> {
  requirePermission(actor, "staff:create");

  const existing = await deps.users.findByEmail(input.email);
  if (existing) {
    throw new ValidationError("A staff account with this email already exists.");
  }

  for (const roleId of input.roleIds) {
    const role = await deps.roles.findById(roleId);
    if (!role) {
      throw new ValidationError(`Role "${roleId}" does not exist.`);
    }
  }

  const authUser = await deps.authSession.createUser(input.email);
  const now = new Date();

  await deps.users.create({
    uid: authUser.uid,
    email: input.email,
    displayName: input.displayName,
    status: "active",
    roleIds: input.roleIds,
    directPermissions: [],
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
  });

  const passwordResetLink = await deps.authSession.generatePasswordResetLink(input.email);

  await deps.auditLogs.record({
    type: "staff_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid: authUser.uid,
    metadata: { email: input.email, roleIds: input.roleIds },
  });

  return { uid: authUser.uid, passwordResetLink };
}

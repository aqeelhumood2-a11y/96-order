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
}

/**
 * Creates a staff account. Staff can never self-register (there is no
 * public registration route) — this is the only way a new staff account
 * comes into existence, and it always requires `staff:create` (or
 * `staff:manage`, via the namespace wildcard).
 *
 * The new account has no password set; `sendPasswordResetEmail` (Firebase's
 * hosted delivery, triggered server-side) doubles as the "set your initial
 * password" email. No link is ever returned to the caller, logged, or
 * shown in the admin UI — the only observable effect is that an email may
 * have been sent, matching the same contract as the public forgot-password
 * flow.
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

  await deps.authSession.sendPasswordResetEmail(input.email);

  await deps.auditLogs.record({
    type: "staff_created",
    actorUid: actor.uid,
    actorEmail: actor.email,
    targetUid: authUser.uid,
    metadata: { email: input.email, roleIds: input.roleIds },
  });

  return { uid: authUser.uid };
}

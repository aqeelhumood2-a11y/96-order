import { SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/**
 * Enforces "the last active super admin cannot be deactivated or stripped
 * of the super_admin role" — used by both set-staff-status.ts (deactivation)
 * and assign-roles.ts (role removal). Multiple active super admins can
 * freely lose the role or be deactivated one at a time; only the *last*
 * one remaining is protected, which is what actually prevents a total
 * lockout rather than just treating every super admin as untouchable
 * forever.
 */
export async function assertNotRemovingLastActiveSuperAdmin(deps: AuthDeps = defaultAuthDeps): Promise<void> {
  const activeSuperAdminCount = await deps.users.countActiveUsersWithRole(SUPER_ADMIN_ROLE_ID);
  if (activeSuperAdminCount <= 1) {
    throw new ForbiddenError("At least one active super admin must remain.");
  }
}

import type { Session } from "@/core/auth/entities";
import type { Page, PageRequest } from "@/core/interfaces/repository";
import type { Role } from "@/core/auth/entities";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

/** `staff:view` is enough to read the roles list (e.g. to populate a role picker); mutating roles still needs `staff:manage`. */
export async function listRoles(actor: Session, request: PageRequest, deps: AuthDeps = defaultAuthDeps): Promise<Page<Role>> {
  requirePermission(actor, "staff:view");
  return deps.roles.list(request);
}

import type { Session } from "@/core/auth/entities";
import type { Page } from "@/core/interfaces/repository";
import type { StaffUser } from "@/core/auth/entities";
import type { ListUsersRequest } from "@/core/interfaces/user-repository";
import { requirePermission } from "./session";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export async function listStaff(actor: Session, request: ListUsersRequest, deps: AuthDeps = defaultAuthDeps): Promise<Page<StaffUser>> {
  requirePermission(actor, "staff:view");
  return deps.users.list(request);
}

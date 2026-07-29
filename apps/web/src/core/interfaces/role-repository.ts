import type { Role } from "@/core/auth/entities";
import type { Page, PageRequest } from "./repository";

/**
 * Port for the `roles/{roleId}` collection. The `super_admin` system role
 * is seeded only by the bootstrap script; this port makes no distinction
 * itself — protecting system roles from mutation is enforced in
 * `services/auth`, not here, since that's a business rule, not a storage
 * concern.
 */
export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  list(request: PageRequest): Promise<Page<Role>>;
  create(role: Role): Promise<void>;
  update(id: string, patch: Partial<Pick<Role, "name" | "description" | "permissions" | "updatedBy">>): Promise<void>;
  delete(id: string): Promise<void>;
}

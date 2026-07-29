import type { StaffUser, StaffUserStatus } from "@/core/auth/entities";
import type { Permission } from "@/core/auth/permissions";
import type { Page, PageRequest } from "./repository";

export interface ListUsersRequest extends PageRequest {
  status?: StaffUserStatus;
}

/**
 * Port for the `users/{uid}` collection (staff accounts only — customers
 * are out of scope for Phase 2). `infrastructure/firebase/repositories`
 * provides the Firestore implementation via the Admin SDK.
 */
export interface UserRepository {
  findByUid(uid: string): Promise<StaffUser | null>;
  findByEmail(email: string): Promise<StaffUser | null>;
  list(request: ListUsersRequest): Promise<Page<StaffUser>>;
  create(user: StaffUser): Promise<void>;
  setStatus(uid: string, status: StaffUserStatus, changedBy: string): Promise<void>;
  assignRoles(uid: string, roleIds: string[]): Promise<void>;
  setDirectPermissions(uid: string, permissions: Permission[]): Promise<void>;
  recordLogin(uid: string, at: Date): Promise<void>;
}

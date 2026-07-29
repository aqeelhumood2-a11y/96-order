import type { AuditLogRepository } from "@/core/interfaces/audit-log-repository";
import type { AuthSessionPort } from "@/core/interfaces/auth-session-port";
import type { RateLimiter } from "@/core/interfaces/rate-limiter";
import type { RoleRepository } from "@/core/interfaces/role-repository";
import type { UserRepository } from "@/core/interfaces/user-repository";
import { FirebaseAuthSession } from "@/infrastructure/firebase/auth-session";
import { FirestoreAuditLogRepository } from "@/infrastructure/firebase/repositories/firestore-audit-log-repository";
import { FirestoreRateLimiter } from "@/infrastructure/firebase/repositories/firestore-rate-limiter";
import { FirestoreRoleRepository } from "@/infrastructure/firebase/repositories/firestore-role-repository";
import { FirestoreUserRepository } from "@/infrastructure/firebase/repositories/firestore-user-repository";

/**
 * Composition root: wires the concrete Firebase adapters to the ports every
 * use case in this folder depends on. Each use case accepts these as a
 * defaultable parameter, so unit tests inject mocks instead of importing
 * this module at all.
 */
export interface AuthDeps {
  users: UserRepository;
  roles: RoleRepository;
  auditLogs: AuditLogRepository;
  rateLimiter: RateLimiter;
  authSession: AuthSessionPort;
}

export const defaultAuthDeps: AuthDeps = {
  users: new FirestoreUserRepository(),
  roles: new FirestoreRoleRepository(),
  auditLogs: new FirestoreAuditLogRepository(),
  rateLimiter: new FirestoreRateLimiter(),
  authSession: new FirebaseAuthSession(),
};

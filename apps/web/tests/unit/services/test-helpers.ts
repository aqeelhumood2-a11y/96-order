import { vi } from "vitest";
import type { Session } from "@/core/auth/entities";
import type { AuthDeps } from "@/services/auth/dependencies";

export function createMockDeps(overrides: Partial<AuthDeps> = {}): AuthDeps {
  const deps: AuthDeps = {
    users: {
      findByUid: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: vi.fn().mockResolvedValue(undefined),
      setStatus: vi.fn().mockResolvedValue(undefined),
      assignRoles: vi.fn().mockResolvedValue(undefined),
      setDirectPermissions: vi.fn().mockResolvedValue(undefined),
      recordLogin: vi.fn().mockResolvedValue(undefined),
      // Defaults to "more than one active super admin exists" so tests
      // unrelated to the last-admin guard aren't accidentally blocked by
      // it; tests that specifically exercise the guard override this to 1.
      countActiveUsersWithRole: vi.fn().mockResolvedValue(2),
    },
    roles: {
      findById: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    auditLogs: {
      record: vi.fn().mockImplementation(async (entry) => ({ id: "log-1", createdAt: new Date(), ...entry })),
      list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    },
    rateLimiter: {
      consume: vi.fn().mockResolvedValue({ allowed: true }),
    },
    authSession: {
      signInWithPassword: vi.fn().mockResolvedValue({ idToken: "id-token" }),
      verifyIdToken: vi.fn(),
      createSessionCookie: vi.fn().mockResolvedValue("session-cookie"),
      verifySessionCookie: vi.fn(),
      revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
      getUserByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn(),
      setSuperAdminClaim: vi.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    },
  };

  return { ...deps, ...overrides };
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    uid: "actor-uid",
    email: "actor@example.com",
    roleIds: [],
    effectivePermissions: new Set(),
    ...overrides,
  };
}

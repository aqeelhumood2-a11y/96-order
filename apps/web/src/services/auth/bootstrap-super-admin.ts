import { Timestamp } from "firebase-admin/firestore";
import { allManagePermissions, SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { NotFoundError } from "@/core/errors";
import { getAdminFirestore } from "@/infrastructure/firebase/admin";
import { defaultAuthDeps, type AuthDeps } from "./dependencies";

export interface BootstrapSuperAdminInput {
  email: string;
}

export interface BootstrapSuperAdminResult {
  alreadyInitialized: boolean;
  uid?: string;
}

/**
 * The one-time super-admin bootstrap use case, invoked only by
 * `scripts/bootstrap-super-admin.ts` (never a route). This is the one
 * service function that talks to Firestore directly instead of through a
 * repository port — it has to atomically touch `users`, `roles`, and
 * `system/bootstrap` together in a single transaction, which a
 * single-collection repository port isn't the right shape for, and this
 * operation only ever runs once per environment.
 *
 * Ordering is deliberate: custom claims are set *before* the Firestore
 * transaction. `setSuperAdminClaim` is idempotent and safe to retry, so if
 * the process dies between the two steps, `superAdminInitialized` is still
 * false and re-running the script simply retries both — reversing the
 * order would let a crash leave the idempotency flag set while the claim
 * was never actually applied.
 */
export async function bootstrapSuperAdmin(
  input: BootstrapSuperAdminInput,
  deps: AuthDeps = defaultAuthDeps,
): Promise<BootstrapSuperAdminResult> {
  const db = getAdminFirestore();
  const bootstrapRef = db.collection("system").doc("bootstrap");

  const existing = await bootstrapRef.get();
  if (existing.exists && existing.data()?.superAdminInitialized === true) {
    return { alreadyInitialized: true };
  }

  const authUser = await deps.authSession.getUserByEmail(input.email);
  if (!authUser) {
    throw new NotFoundError(
      `No Firebase Auth user found for ${input.email}. Create the user first (Firebase Console or a separate Admin SDK call, with no password handled by this script), then re-run this command.`,
    );
  }

  await deps.authSession.setSuperAdminClaim(authUser.uid);

  const now = Timestamp.now();
  await db.runTransaction(async (tx) => {
    const bootstrapSnap = await tx.get(bootstrapRef);
    if (bootstrapSnap.exists && bootstrapSnap.data()?.superAdminInitialized === true) {
      return;
    }

    tx.set(
      db.collection("roles").doc(SUPER_ADMIN_ROLE_ID),
      {
        name: "Super Admin",
        description: "Full access to every module. Reserved and system-protected — seeded only by the bootstrap script.",
        permissions: allManagePermissions(),
        isSystemRole: true,
        createdAt: now,
        updatedAt: now,
        createdBy: authUser.uid,
        updatedBy: authUser.uid,
      },
      { merge: true },
    );

    tx.set(
      db.collection("users").doc(authUser.uid),
      {
        uid: authUser.uid,
        email: authUser.email,
        status: "active",
        roleIds: [SUPER_ADMIN_ROLE_ID],
        directPermissions: [],
        createdAt: now,
        updatedAt: now,
        createdBy: authUser.uid,
      },
      { merge: true },
    );

    tx.set(bootstrapRef, {
      superAdminInitialized: true,
      initializedAt: now,
      initializedByUid: authUser.uid,
    });
  });

  await deps.auditLogs.record({
    type: "bootstrap_completed",
    actorUid: authUser.uid,
    actorEmail: authUser.email,
    metadata: {},
  });

  return { alreadyInitialized: false, uid: authUser.uid };
}

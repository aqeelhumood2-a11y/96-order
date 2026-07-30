import { allManagePermissions, SUPER_ADMIN_ROLE_ID } from "@/core/auth/permissions";
import { getAdminAuth, getAdminFirestore } from "@/infrastructure/firebase/admin";

export const SUPER_ADMIN_EMAIL = "super-admin-e2e@example.com";
export const SUPER_ADMIN_PASSWORD = "Sup3rAdminE2ePass!";
export const NO_PERMISSION_STAFF_EMAIL = "no-permission-e2e@example.com";
export const NO_PERMISSION_STAFF_PASSWORD = "NoPermissionE2ePass!";
/**
 * A separate account (not the shared super-admin fixture) for
 * storefront.spec.ts's catalog seeding — auth.spec.ts and catalog.spec.ts
 * already log in as the super admin several times each, and the login
 * rate limiter (`config/auth.ts`'s `sessionCreateByEmail`, 5 per 15
 * minutes — a real production safety limit, not something to weaken for
 * tests) is scoped per email. Seeding through its own account keeps the
 * storefront fixtures from tipping that shared bucket over its limit.
 */
export const CATALOG_SEED_EMAIL = "catalog-seed-e2e@example.com";
export const CATALOG_SEED_PASSWORD = "CatalogSeedE2ePass!";

async function upsertAuthUser(email: string, password: string): Promise<string> {
  const auth = getAdminAuth();
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, emailVerified: true });
    return created.uid;
  }
}

/**
 * Seeds two fixture staff accounts directly against the Auth + Firestore
 * emulators before the auth e2e spec runs (real passwords here are fine —
 * this is test-only fixture setup against an emulator, not the production
 * staff-onboarding flow, which never handles a raw password).
 */
export default async function globalSetup() {
  const db = getAdminFirestore();
  const now = new Date();

  const superAdminUid = await upsertAuthUser(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
  await getAdminAuth().setCustomUserClaims(superAdminUid, { sa: true });
  await db.collection("roles").doc(SUPER_ADMIN_ROLE_ID).set(
    {
      name: "Super Admin",
      description: "Full access to every module.",
      permissions: allManagePermissions(),
      isSystemRole: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "e2e-global-setup",
      updatedBy: "e2e-global-setup",
    },
    { merge: true },
  );
  await db.collection("users").doc(superAdminUid).set(
    {
      uid: superAdminUid,
      email: SUPER_ADMIN_EMAIL,
      status: "active",
      roleIds: [SUPER_ADMIN_ROLE_ID],
      directPermissions: [],
      createdAt: now,
      updatedAt: now,
      createdBy: "e2e-global-setup",
    },
    { merge: true },
  );

  const staffUid = await upsertAuthUser(NO_PERMISSION_STAFF_EMAIL, NO_PERMISSION_STAFF_PASSWORD);
  await db.collection("users").doc(staffUid).set(
    {
      uid: staffUid,
      email: NO_PERMISSION_STAFF_EMAIL,
      status: "active",
      roleIds: [],
      directPermissions: [],
      createdAt: now,
      updatedAt: now,
      createdBy: "e2e-global-setup",
    },
    { merge: true },
  );

  const catalogSeedUid = await upsertAuthUser(CATALOG_SEED_EMAIL, CATALOG_SEED_PASSWORD);
  await db.collection("users").doc(catalogSeedUid).set(
    {
      uid: catalogSeedUid,
      email: CATALOG_SEED_EMAIL,
      status: "active",
      roleIds: [],
      directPermissions: ["categories:manage", "brands:manage", "products:manage"],
      createdAt: now,
      updatedAt: now,
      createdBy: "e2e-global-setup",
    },
    { merge: true },
  );
}

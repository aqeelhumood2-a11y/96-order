/**
 * Fixed permission namespaces reserved for every future module. Phase 2
 * implements none of the modules behind them — only the auth/RBAC
 * foundation that will gate them once they exist.
 */
export const PERMISSION_NAMESPACES = [
  "dashboard",
  "products",
  "categories",
  "brands",
  "inventory",
  "orders",
  "customers",
  "reports",
  "cms",
  "settings",
  "payments",
  "integrations",
  "staff",
  "audit_logs",
] as const;

/**
 * `adjust` was added in Phase 3 for inventory: adjusting stock levels is a
 * distinct, more sensitive action than editing a product/variant's
 * descriptive fields (`edit`), so `inventory:adjust` is granted separately
 * from `inventory:edit` — a role can be given one without the other. The
 * `manage` wildcard still covers it like every other action in a namespace.
 */
export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export", "manage", "adjust"] as const;

export type PermissionNamespace = (typeof PERMISSION_NAMESPACES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/** `"{namespace}:{action}"`, e.g. `"staff:manage"`. */
export type Permission = `${PermissionNamespace}:${PermissionAction}`;

export function isPermissionNamespace(value: string): value is PermissionNamespace {
  return (PERMISSION_NAMESPACES as readonly string[]).includes(value);
}

export function isPermissionAction(value: string): value is PermissionAction {
  return (PERMISSION_ACTIONS as readonly string[]).includes(value);
}

export function isPermission(value: string): value is Permission {
  const [namespace, action] = value.split(":");
  return namespace !== undefined && action !== undefined && isPermissionNamespace(namespace) && isPermissionAction(action);
}

export function formatPermission(namespace: PermissionNamespace, action: PermissionAction): Permission {
  return `${namespace}:${action}`;
}

/**
 * The one reserved, system-protected role id. A user holding this role
 * bypasses every permission check unconditionally — this is the "super
 * admin protection" invariant, not just a role with every permission
 * listed out.
 */
export const SUPER_ADMIN_ROLE_ID = "super_admin";

export interface PermissionPrincipal {
  roleIds: readonly string[];
  effectivePermissions: ReadonlySet<Permission>;
}

export function isSuperAdmin(principal: Pick<PermissionPrincipal, "roleIds">): boolean {
  return principal.roleIds.includes(SUPER_ADMIN_ROLE_ID);
}

/**
 * Exact match or the namespace's `manage` wildcard. Super admin always
 * passes, regardless of what's in `effectivePermissions`.
 */
export function hasPermission(principal: PermissionPrincipal, required: Permission): boolean {
  if (isSuperAdmin(principal)) {
    return true;
  }

  if (principal.effectivePermissions.has(required)) {
    return true;
  }

  const [namespace] = required.split(":") as [PermissionNamespace, PermissionAction];
  return principal.effectivePermissions.has(formatPermission(namespace, "manage"));
}

/** Every `{namespace}:manage` permission — used to seed the super_admin role. */
export function allManagePermissions(): Permission[] {
  return PERMISSION_NAMESPACES.map((namespace) => formatPermission(namespace, "manage"));
}

/**
 * Effective permission set for a user: the union of every assigned role's
 * permissions plus any direct grants. Resolved per-request from Firestore
 * reads (not denormalized) — see services/auth/session.ts for caching.
 */
export function resolveEffectivePermissions(
  roleIds: readonly string[],
  directPermissions: readonly Permission[],
  roles: readonly { id: string; permissions: readonly Permission[] }[],
): Set<Permission> {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const effective = new Set<Permission>(directPermissions);

  for (const roleId of roleIds) {
    const role = roleById.get(roleId);
    if (!role) continue;
    for (const permission of role.permissions) {
      effective.add(permission);
    }
  }

  return effective;
}

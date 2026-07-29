import type { Page } from "@/core/interfaces/repository";
import type { Role } from "@/core/auth/entities";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { RoleForm } from "@/features/roles/components/role-form";
import { RolesTable } from "@/features/roles/components/roles-table";
import { listRoles } from "@/services/auth/list-roles";
import { requireSession } from "@/services/auth/session";

export default async function RolesPage() {
  const session = await requireSession();

  let rolesPage: Page<Role> | null = null;
  try {
    rolesPage = await listRoles(session, { limit: 50 });
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!rolesPage) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const canManage = hasPermission(session, "staff:manage");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Roles</h1>
        <RolesTable roles={rolesPage.items} canManage={canManage} />
      </div>

      {canManage && (
        <div className="flex flex-col gap-4 border-t border-brand-100 pt-6">
          <h2 className="text-lg font-semibold text-brand-950">Create role</h2>
          <RoleForm />
        </div>
      )}
    </div>
  );
}

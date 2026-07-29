import type { Page } from "@/core/interfaces/repository";
import type { Role, StaffUser } from "@/core/auth/entities";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { CreateStaffForm } from "@/features/staff/components/create-staff-form";
import { StaffTable } from "@/features/staff/components/staff-table";
import { listRoles } from "@/services/auth/list-roles";
import { listStaff } from "@/services/auth/list-staff";
import { requireSession } from "@/services/auth/session";

export default async function StaffPage() {
  const session = await requireSession();

  let pages: { staffPage: Page<StaffUser>; rolesPage: Page<Role> } | null = null;
  try {
    const [staffPage, rolesPage] = await Promise.all([
      listStaff(session, { limit: 50 }),
      listRoles(session, { limit: 50 }),
    ]);
    pages = { staffPage, rolesPage };
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!pages) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const canCreate = hasPermission(session, "staff:create");
  const canEdit = hasPermission(session, "staff:edit");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Staff</h1>
        <StaffTable staff={pages.staffPage.items} roles={pages.rolesPage.items} canEdit={canEdit} />
      </div>

      {canCreate && (
        <div className="flex flex-col gap-4 border-t border-brand-100 pt-6">
          <h2 className="text-lg font-semibold text-brand-950">Add staff account</h2>
          <CreateStaffForm roles={pages.rolesPage.items} />
        </div>
      )}
    </div>
  );
}

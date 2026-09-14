import type { Page } from "@/core/interfaces/repository";
import type { Role, StaffUser } from "@/core/auth/entities";
import { ForbiddenError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { CreateStaffForm } from "@/features/staff/components/create-staff-form";
import { StaffTable } from "@/features/staff/components/staff-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { listRoles } from "@/services/auth/list-roles";
import { listStaff } from "@/services/auth/list-staff";
import { requireSession } from "@/services/auth/session";

export default async function StaffPage() {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);

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
    return <p className="text-sm text-foreground/70">{getDictionary(locale).admin.noPermissionPage}</p>;
  }

  const canCreate = hasPermission(session, "staff:create");
  const canEdit = hasPermission(session, "staff:edit");
  const dict = getDictionary(locale).admin.staffPage;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <StaffTable staff={pages.staffPage.items} roles={pages.rolesPage.items} canEdit={canEdit} locale={locale} />
      </div>

      {canCreate && (
        <div className="flex flex-col gap-4 border-t border-brand-100 pt-6">
          <h2 className="text-lg font-semibold text-brand-950">{dict.addStaffAccount}</h2>
          <CreateStaffForm roles={pages.rolesPage.items} locale={locale} />
        </div>
      )}
    </div>
  );
}

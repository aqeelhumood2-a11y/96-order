import type { Role, StaffUser } from "@/core/auth/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { StaffRowActions } from "./staff-row-actions";

export function StaffTable({ staff, roles, canEdit, locale = DEFAULT_LOCALE }: { staff: StaffUser[]; roles: Role[]; canEdit: boolean; locale?: Locale }) {
  const dict = getDictionary(locale).admin.staffPage;
  const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

  if (staff.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.noStaff}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-foreground/69">
            <th className="py-2 pr-4 font-medium">{dict.table.email}</th>
            <th className="py-2 pr-4 font-medium">{dict.table.roles}</th>
            <th className="py-2 pr-4 font-medium">{dict.table.status}</th>
            {canEdit && <th className="py-2 pr-4 font-medium">{dict.table.actions}</th>}
          </tr>
        </thead>
        <tbody>
          {staff.map((user) => (
            <tr key={user.uid} className="border-b border-brand-50">
              <td className="py-3 pr-4">{user.email}</td>
              <td className="py-3 pr-4">{user.roleIds.map((id) => roleNameById.get(id) ?? id).join(", ") || "—"}</td>
              <td className="py-3 pr-4">
                <span
                  className={
                    user.status === "active"
                      ? "rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                      : "rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700"
                  }
                >
                  {user.status === "active" ? dict.statusActive : dict.statusDeactivated}
                </span>
              </td>
              {canEdit && (
                <td className="py-3 pr-4">
                  <StaffRowActions uid={user.uid} status={user.status} canEdit={canEdit} locale={locale} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

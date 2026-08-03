import type { Role, StaffUser } from "@/core/auth/entities";
import { StaffRowActions } from "./staff-row-actions";

export function StaffTable({ staff, roles, canEdit }: { staff: StaffUser[]; roles: Role[]; canEdit: boolean }) {
  const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

  if (staff.length === 0) {
    return <p className="text-sm text-foreground/60">No staff accounts yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-foreground/60">
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Roles</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            {canEdit && <th className="py-2 pr-4 font-medium">Actions</th>}
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
                  {user.status}
                </span>
              </td>
              {canEdit && (
                <td className="py-3 pr-4">
                  <StaffRowActions uid={user.uid} status={user.status} canEdit={canEdit} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { Role } from "@/core/auth/entities";
import { DeleteRoleButton } from "./delete-role-button";

export function RolesTable({ roles, canManage }: { roles: Role[]; canManage: boolean }) {
  if (roles.length === 0) {
    return <p className="text-sm text-foreground/69">No roles yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-foreground/69">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Permissions</th>
            {canManage && <th className="py-2 pr-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b border-brand-50">
              <td className="py-3 pr-4">
                {role.name}
                {role.isSystemRole && (
                  <span className="ml-2 rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-800">
                    system
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 text-foreground/70">{role.description}</td>
              <td className="py-3 pr-4 text-foreground/70">{role.permissions.length}</td>
              {canManage && <td className="py-3 pr-4">{!role.isSystemRole && <DeleteRoleButton roleId={role.id} />}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

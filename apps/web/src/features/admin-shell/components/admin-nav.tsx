import Link from "next/link";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";
import { LogoutButton } from "./logout-button";

/**
 * Shows only the links the current session has permission for. This is
 * UX only — hiding a link here does not enforce anything; every page and
 * action independently calls `requirePermission()` regardless of what this
 * nav renders.
 */
export function AdminNav({ session }: { session: Session }) {
  const links = [
    { href: "/admin", label: "Dashboard", visible: true },
    { href: "/admin/staff", label: "Staff", visible: hasPermission(session, "staff:view") },
    { href: "/admin/roles", label: "Roles", visible: hasPermission(session, "staff:view") },
    { href: "/admin/products", label: "Products", visible: hasPermission(session, "products:view") },
    { href: "/admin/categories", label: "Categories", visible: hasPermission(session, "categories:view") },
    { href: "/admin/brands", label: "Brands", visible: hasPermission(session, "brands:view") },
    { href: "/admin/inventory", label: "Inventory", visible: hasPermission(session, "inventory:view") },
  ];

  return (
    <nav className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
      <div className="flex items-center gap-6">
        {links
          .filter((link) => link.visible)
          .map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-brand-900 hover:underline">
              {link.label}
            </Link>
          ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground/60">{session.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}

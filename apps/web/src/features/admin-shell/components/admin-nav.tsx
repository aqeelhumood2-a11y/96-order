import Link from "next/link";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";
import { Logo } from "@/ui/layout/logo";
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
    { href: "/admin/orders", label: "Orders", visible: hasPermission(session, "orders:view") },
    { href: "/admin/customers", label: "Customers", visible: hasPermission(session, "customers:view") },
    { href: "/admin/staff", label: "Staff", visible: hasPermission(session, "staff:view") },
    { href: "/admin/roles", label: "Roles", visible: hasPermission(session, "staff:view") },
    { href: "/admin/products", label: "Products", visible: hasPermission(session, "products:view") },
    { href: "/admin/categories", label: "Categories", visible: hasPermission(session, "categories:view") },
    { href: "/admin/brands", label: "Brands", visible: hasPermission(session, "brands:view") },
    { href: "/admin/inventory", label: "Inventory", visible: hasPermission(session, "inventory:view") },
    { href: "/admin/reports", label: "Reports", visible: hasPermission(session, "reports:view") },
    { href: "/admin/ai-assistant", label: "AI Assistant", visible: hasPermission(session, "reports:view") },
    { href: "/admin/integrations", label: "Integrations", visible: hasPermission(session, "integrations:view") },
    { href: "/admin/cms/pages", label: "CMS", visible: hasPermission(session, "cms:view") },
    { href: "/admin/site-settings", label: "Site Settings", visible: hasPermission(session, "settings:view") },
    { href: "/admin/coupons", label: "Coupons", visible: hasPermission(session, "promotions:view") },
    { href: "/admin/promotions", label: "Promotions", visible: hasPermission(session, "promotions:view") },
    { href: "/admin/reviews", label: "Reviews", visible: hasPermission(session, "reviews:view") },
    { href: "/admin/questions", label: "Questions", visible: hasPermission(session, "questions:view") },
    { href: "/admin/notifications/back-in-stock", label: "Notifications", visible: hasPermission(session, "notifications:view") },
  ];

  return (
    <nav className="flex items-center justify-between border-b border-surface-border px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/admin" aria-label="Ninety Six Degrees Cafe admin" className="mr-2 flex items-center">
          <Logo variant="mark" color="purple" height={28} />
        </Link>
        {links
          .filter((link) => link.visible)
          .map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-brand-900 hover:underline">
              {link.label}
            </Link>
          ))}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-foreground/69">{session.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}

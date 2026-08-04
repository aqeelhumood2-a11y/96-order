"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Session } from "@/core/auth/entities";
import { hasPermission } from "@/core/auth/permissions";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/ui/primitives";
import { Logo } from "@/ui/layout/logo";
import { cn } from "@/lib/cn";
import { LogoutButton } from "./logout-button";

interface NavLinkItem {
  href: string;
  label: string;
  visible: boolean;
}

interface NavGroup {
  /** `null` for the ungrouped top-level Dashboard link — every other group gets a small section label. */
  title: string | null;
  links: NavLinkItem[];
}

/**
 * Grouped by what a store owner is actually trying to do, not by the order
 * features happened to ship in — see the admin-panel redesign's report for
 * why (previously: 18 links in one flat row with no hierarchy at all).
 * Every href/label/permission check is unchanged from before this pass —
 * only the grouping and layout changed, so nothing that depended on a
 * specific link existing or being permission-gated moved or broke.
 */
function buildNavGroups(session: Session): NavGroup[] {
  return [
    { title: null, links: [{ href: "/admin", label: "Dashboard", visible: true }] },
    {
      title: "Catalog",
      links: [
        { href: "/admin/products", label: "Products", visible: hasPermission(session, "products:view") },
        { href: "/admin/categories", label: "Categories", visible: hasPermission(session, "categories:view") },
        { href: "/admin/brands", label: "Brands", visible: hasPermission(session, "brands:view") },
        { href: "/admin/inventory", label: "Inventory", visible: hasPermission(session, "inventory:view") },
      ],
    },
    {
      title: "Sales",
      links: [
        { href: "/admin/orders", label: "Orders", visible: hasPermission(session, "orders:view") },
        { href: "/admin/customers", label: "Customers", visible: hasPermission(session, "customers:view") },
      ],
    },
    {
      title: "Marketing",
      links: [
        { href: "/admin/promotions", label: "Promotions", visible: hasPermission(session, "promotions:view") },
        { href: "/admin/coupons", label: "Coupons", visible: hasPermission(session, "promotions:view") },
        { href: "/admin/reviews", label: "Reviews", visible: hasPermission(session, "reviews:view") },
        { href: "/admin/questions", label: "Questions", visible: hasPermission(session, "questions:view") },
      ],
    },
    {
      title: "Content",
      links: [
        { href: "/admin/cms/pages", label: "CMS", visible: hasPermission(session, "cms:view") },
        { href: "/admin/site-settings", label: "Site Settings", visible: hasPermission(session, "settings:view") },
      ],
    },
    {
      title: "Insights",
      links: [
        { href: "/admin/reports", label: "Reports", visible: hasPermission(session, "reports:view") },
        { href: "/admin/ai-assistant", label: "AI Assistant", visible: hasPermission(session, "reports:view") },
      ],
    },
    {
      title: "System",
      links: [
        { href: "/admin/staff", label: "Staff", visible: hasPermission(session, "staff:view") },
        { href: "/admin/roles", label: "Roles", visible: hasPermission(session, "staff:view") },
        { href: "/admin/integrations", label: "Integrations", visible: hasPermission(session, "integrations:view") },
        { href: "/admin/notifications/back-in-stock", label: "Notifications", visible: hasPermission(session, "notifications:view") },
      ],
    },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {groups.map((group, index) => {
        const visibleLinks = group.links.filter((link) => link.visible);
        if (visibleLinks.length === 0) return null;
        return (
          <div key={group.title ?? `group-${index}`} className="flex flex-col gap-1">
            {group.title && (
              <span className="px-3 text-xs font-semibold tracking-wide text-foreground/50 uppercase">{group.title}</span>
            )}
            {visibleLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-100 text-brand-950" : "text-brand-800 hover:bg-brand-50 hover:text-brand-950",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminNav({ session }: { session: Session }) {
  const pathname = usePathname();
  const groups = buildNavGroups(session);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop / tablet: fixed left sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-surface-border bg-background p-4 md:flex">
        <Link href="/admin" aria-label="Ninety Six Degrees Cafe admin" className="flex items-center gap-2 px-1">
          <Logo variant="mark" color="purple" height={28} />
          <span className="text-sm font-semibold text-brand-950">Admin</span>
        </Link>

        <NavLinks groups={groups} pathname={pathname} />

        <div className="flex flex-col gap-2 border-t border-surface-border pt-3">
          <span className="truncate px-1 text-xs text-foreground/65">{session.email}</span>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile: slim top bar + slide-out drawer, same interaction pattern as the storefront's mobile nav */}
      <div className="flex items-center justify-between border-b border-surface-border bg-background px-4 py-3 md:hidden">
        <Link href="/admin" aria-label="Ninety Six Degrees Cafe admin" className="flex items-center gap-2">
          <Logo variant="mark" color="purple" height={24} />
          <span className="text-sm font-semibold text-brand-950">Admin</span>
        </Link>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open admin menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-brand-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </DialogTrigger>
          <DialogContent className="top-0 left-0 flex max-w-none translate-x-0 translate-y-0 flex-col rounded-none p-6 sm:max-w-xs">
            <div className="flex items-center justify-between">
              <DialogTitle>Admin menu</DialogTitle>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/69 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </DialogClose>
            </div>
            <div className="mt-4 flex flex-1 flex-col overflow-hidden">
              <NavLinks groups={groups} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="flex flex-col gap-2 border-t border-surface-border pt-3">
              <span className="truncate px-1 text-xs text-foreground/65">{session.email}</span>
              <LogoutButton />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

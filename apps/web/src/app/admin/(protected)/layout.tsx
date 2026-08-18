import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/features/admin-shell/components/admin-nav";
import { getLocale } from "@/lib/i18n/locale";
import { getSession } from "@/services/auth/session";

/**
 * This redirect is UX-only defense-in-depth (avoids a flash of protected
 * content) — it is not the authorization boundary. Every page below still
 * calls `requireSession()`/`requirePermission()` itself, and every Server
 * Action/Route Handler must too, since neither runs through this layout.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <AdminNav session={session} locale={locale} />
      <main className="flex flex-1 flex-col overflow-x-hidden p-4 sm:p-6">{children}</main>
    </div>
  );
}

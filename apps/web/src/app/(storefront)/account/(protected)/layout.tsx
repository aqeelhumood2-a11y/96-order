import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "@/features/customer-auth/components/logout-button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCustomerSession } from "@/services/customer-auth/session";

/** UX-only redirect, same discipline as `app/admin/(protected)/layout.tsx` — every page/action below still calls `requireCustomerSession()` itself. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const [session, locale] = await Promise.all([getCustomerSession(), getLocale()]);
  if (!session) {
    redirect("/account/login?next=/account");
  }
  const dict = getDictionary(locale).storefront.account.pages;

  const accountNav = [
    { href: "/account", label: dict.navOverview },
    { href: "/account/orders", label: dict.navOrders },
    { href: "/account/profile", label: dict.navProfile },
    { href: "/account/addresses", label: dict.navAddresses },
    { href: "/account/wishlist", label: dict.navWishlist },
    { href: "/account/notifications", label: dict.navNotifications },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 sm:w-48">
        <nav className="flex flex-row flex-wrap gap-3 sm:flex-col">
          {accountNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-900 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <CustomerLogoutButton locale={locale} />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "@/features/customer-auth/components/logout-button";
import { getCustomerSession } from "@/services/customer-auth/session";

const ACCOUNT_NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/notifications", label: "Notifications" },
];

/** UX-only redirect, same discipline as `app/admin/(protected)/layout.tsx` — every page/action below still calls `requireCustomerSession()` itself. */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 sm:w-48">
        <nav className="flex flex-row flex-wrap gap-3 sm:flex-col">
          {ACCOUNT_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-brand-900 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <CustomerLogoutButton />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

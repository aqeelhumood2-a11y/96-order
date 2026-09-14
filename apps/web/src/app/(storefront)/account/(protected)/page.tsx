import Link from "next/link";
import { resendVerificationEmailAction } from "@/features/customer-auth/actions";
import { ResendVerificationButton } from "@/features/customer-auth/components/resend-verification-button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyOrders } from "@/services/customer-orders/list-my-orders";

export default async function AccountOverviewPage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const orders = await listMyOrders(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.welcome.replace("{name}", session.displayName)}</h1>

      {!session.emailVerified && (
        <div className="flex flex-col gap-2 rounded-md border border-warning-300 bg-warning-50 p-4 text-sm text-warning-900">
          <p>{dict.verifyEmailPrompt}</p>
          <ResendVerificationButton action={resendVerificationEmailAction} locale={locale} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-brand-100 p-4">
          <p className="text-xs uppercase tracking-wide text-foreground/65">{dict.totalOrders}</p>
          <p className="text-xl font-semibold text-brand-950">{orders.length}</p>
        </div>
        <Link href="/account/addresses" className="rounded-md border border-brand-100 p-4 hover:bg-brand-50/40">
          <p className="text-sm font-medium text-brand-900">{dict.manageAddresses}</p>
        </Link>
        <Link href="/account/wishlist" className="rounded-md border border-brand-100 p-4 hover:bg-brand-50/40">
          <p className="text-sm font-medium text-brand-900">{dict.viewWishlist}</p>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-950">{dict.recentOrders}</h2>
          <Link href="/account/orders" className="text-sm text-brand-700 hover:underline">
            {dict.viewAll}
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-foreground/69">{dict.noOrdersYet}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.orderNumber}`} className="text-sm text-brand-700 hover:underline">
                  {order.orderNumber}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

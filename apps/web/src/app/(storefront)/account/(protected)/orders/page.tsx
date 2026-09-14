import { MyOrdersTable } from "@/features/customer-orders/components/my-orders-table";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { listMyOrders } from "@/services/customer-orders/list-my-orders";

export default async function AccountOrdersPage() {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const orders = await listMyOrders(session);
  const dict = getDictionary(locale).storefront.account.pages;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.orderHistoryHeading}</h1>
      <MyOrdersTable orders={orders} locale={locale} />
    </div>
  );
}

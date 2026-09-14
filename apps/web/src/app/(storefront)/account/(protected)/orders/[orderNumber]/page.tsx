import Link from "next/link";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/core/errors";
import { OrderStatusBadge } from "@/features/admin-orders/components/order-status-badge";
import { CustomerInfoPanel, FulfillmentInfoPanel, LineItemsPanel, PaymentInfoPanel } from "@/features/admin-orders/components/order-info-panels";
import { ReorderButton } from "@/features/customer-orders/components/reorder-button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { getMyOrder } from "@/services/customer-orders/list-my-orders";

interface AccountOrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const [session, locale] = await Promise.all([requireCustomerSession(), getLocale()]);
  const { orderNumber } = await params;
  const dict = getDictionary(locale).storefront.account.pages;

  let order;
  try {
    order = await getMyOrder(session, orderNumber);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/account/orders" className="text-sm text-brand-700 hover:underline">
            {dict.backToOrders}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} locale={locale} />
        </div>
        <ReorderButton orderNumber={order.orderNumber} locale={locale} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CustomerInfoPanel order={order} locale={locale} />
        <PaymentInfoPanel order={order} locale={locale} />
        <FulfillmentInfoPanel order={order} locale={locale} />
      </div>

      <LineItemsPanel order={order} locale={locale} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { OrderStatusBadge } from "@/features/admin-orders/components/order-status-badge";
import { CustomerInfoPanel, FulfillmentInfoPanel, LineItemsPanel, PaymentInfoPanel } from "@/features/admin-orders/components/order-info-panels";
import { OrderStatusTimeline } from "@/features/admin-orders/components/order-status-timeline";
import { OrderReservationStatus } from "@/features/admin-orders/components/order-reservation-status";
import { OrderActionsPanel } from "@/features/admin-orders/components/order-actions-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getOrder } from "@/services/orders/get-order";
import { requireSession } from "@/services/auth/session";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [session, locale] = await Promise.all([requireSession(), getLocale()]);
  const { orderId } = await params;
  const dict = getDictionary(locale).admin.orderDetail;

  let detail;
  try {
    detail = await getOrder(session, orderId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (!(error instanceof ForbiddenError)) throw error;
  }

  if (!detail) {
    return <p className="text-sm text-foreground/70">You don&apos;t have permission to view this page.</p>;
  }

  const { order, events, reservations } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">
            ← {dict.backToOrders}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} locale={locale} />
        </div>
      </div>

      <OrderActionsPanel
        order={order}
        canManageOrders={hasPermission(session, "orders:manage")}
        canManagePayments={hasPermission(session, "payments:manage")}
        locale={locale}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CustomerInfoPanel order={order} locale={locale} />
        <PaymentInfoPanel order={order} locale={locale} />
        <FulfillmentInfoPanel order={order} locale={locale} />
        <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
          <h2 className="text-sm font-semibold text-brand-950">{dict.reservationStatus.title}</h2>
          <OrderReservationStatus reservations={reservations} locale={locale} />
        </div>
      </div>

      <LineItemsPanel order={order} locale={locale} />

      <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
        <h2 className="text-sm font-semibold text-brand-950">{dict.timeline.title}</h2>
        <OrderStatusTimeline events={events} locale={locale} />
      </div>
    </div>
  );
}

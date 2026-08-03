import Link from "next/link";
import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/core/errors";
import { hasPermission } from "@/core/auth/permissions";
import { OrderStatusBadge } from "@/features/admin-orders/components/order-status-badge";
import { CustomerInfoPanel, FulfillmentInfoPanel, LineItemsPanel, PaymentInfoPanel } from "@/features/admin-orders/components/order-info-panels";
import { OrderStatusTimeline } from "@/features/admin-orders/components/order-status-timeline";
import { OrderReservationStatus } from "@/features/admin-orders/components/order-reservation-status";
import { OrderActionsPanel } from "@/features/admin-orders/components/order-actions-panel";
import { getOrder } from "@/services/orders/get-order";
import { requireSession } from "@/services/auth/session";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await requireSession();
  const { orderId } = await params;

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
            ← Orders
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <OrderActionsPanel
        order={order}
        canManageOrders={hasPermission(session, "orders:manage")}
        canManagePayments={hasPermission(session, "payments:manage")}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CustomerInfoPanel order={order} />
        <PaymentInfoPanel order={order} />
        <FulfillmentInfoPanel order={order} />
        <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
          <h2 className="text-sm font-semibold text-brand-950">Inventory reservation status</h2>
          <OrderReservationStatus reservations={reservations} />
        </div>
      </div>

      <LineItemsPanel order={order} />

      <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
        <h2 className="text-sm font-semibold text-brand-950">Status timeline &amp; audit history</h2>
        <OrderStatusTimeline events={events} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/core/errors";
import { OrderStatusBadge } from "@/features/admin-orders/components/order-status-badge";
import { CustomerInfoPanel, FulfillmentInfoPanel, LineItemsPanel, PaymentInfoPanel } from "@/features/admin-orders/components/order-info-panels";
import { ReorderButton } from "@/features/customer-orders/components/reorder-button";
import { requireCustomerSession } from "@/services/customer-auth/session";
import { getMyOrder } from "@/services/customer-orders/list-my-orders";

interface AccountOrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const session = await requireCustomerSession();
  const { orderNumber } = await params;

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
            ← Orders
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <ReorderButton orderNumber={order.orderNumber} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CustomerInfoPanel order={order} />
        <PaymentInfoPanel order={order} />
        <FulfillmentInfoPanel order={order} />
      </div>

      <LineItemsPanel order={order} />
    </div>
  );
}

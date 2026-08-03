import Link from "next/link";
import type { Order } from "@/core/orders/entities";
import { formatMoney } from "@/core/money/money";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-foreground/69">No orders match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full min-w-[840px] text-left text-sm">
        <thead className="border-b border-brand-100 bg-brand-50/50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Fulfillment</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/30">
              <td className="px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-medium text-brand-900 hover:underline">
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-foreground">{order.customer.fullName}</span>
                  <span className="text-xs text-foreground/65">{order.customer.mobile}</span>
                </div>
              </td>
              <td className="px-4 py-3 capitalize text-foreground/80">{order.fulfillment.method}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{formatMoney(order.grandTotal)}</td>
              <td className="px-4 py-3 text-foreground/70">{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

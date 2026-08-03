import Link from "next/link";
import type { Order } from "@/core/orders/entities";
import { formatMoney } from "@/core/money/money";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function MyOrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-foreground/60">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.orderNumber}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-100 p-4 hover:bg-brand-50/40"
        >
          <div>
            <p className="text-sm font-medium text-brand-900">{order.orderNumber}</p>
            <p className="text-xs text-foreground/50">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="capitalize text-foreground/70">{order.status.replace(/_/g, " ")}</span>
            <span className="font-medium text-foreground">{formatMoney(order.grandTotal)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

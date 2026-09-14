import Link from "next/link";
import type { Order } from "@/core/orders/entities";
import { formatMoney } from "@/core/money/money";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function MyOrdersTable({ orders, locale = DEFAULT_LOCALE }: { orders: Order[]; locale?: Locale }) {
  const dict = getDictionary(locale);

  if (orders.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.storefront.account.pages.noOrdersPlaced}</p>;
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
            <p className="text-xs text-foreground/65">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-foreground/70">{dict.admin.orderStatus[order.status]}</span>
            <span className="font-medium text-foreground">{formatMoney(order.grandTotal)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

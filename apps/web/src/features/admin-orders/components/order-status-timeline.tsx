import type { OrderStatusEvent } from "@/core/orders/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** The "status timeline"/"order history" panel — every `OrderStatusEvent` for this order, oldest first (see `services/orders/get-order.ts`). Also doubles as this order's own slice of "audit history" (README's Admin Order Management requirements) since every transition is recorded here with its actor. */
export function OrderStatusTimeline({ events, locale = DEFAULT_LOCALE }: { events: OrderStatusEvent[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.timeline;
  const orderStatusDict = getDictionary(locale).admin.orderStatus;

  if (events.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.none}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 border-l-2 border-brand-200 pl-3 text-sm">
          <span className="font-medium text-foreground">
            {event.fromStatus ? `${orderStatusDict[event.fromStatus]} → ` : `${dict.createdAs} `}
            {orderStatusDict[event.toStatus]}
          </span>
          <span className="text-xs text-foreground/65">
            {formatDateTime(event.createdAt)} · {event.actorId}
          </span>
          {event.note && <span className="text-xs text-foreground/70">{event.note}</span>}
        </li>
      ))}
    </ol>
  );
}

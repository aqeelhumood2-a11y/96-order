import type { InventoryReservation } from "@/core/catalog/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Badge } from "@/ui/primitives/badge";

const STATUS_VARIANT = {
  reserved: "warning",
  committed: "success",
  released: "neutral",
} as const;

/** README's "Inventory reservation status" requirement — every reservation row this order created, whatever its current state. */
export function OrderReservationStatus({ reservations, locale = DEFAULT_LOCALE }: { reservations: InventoryReservation[]; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.reservationStatus;

  if (reservations.length === 0) {
    return <p className="text-sm text-foreground/69">{dict.none}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-foreground/65">
          <tr>
            <th className="py-1.5 font-medium">{dict.product}</th>
            <th className="py-1.5 text-right font-medium">{dict.qty}</th>
            <th className="py-1.5 font-medium">{dict.status}</th>
            <th className="py-1.5 font-medium">{dict.expires}</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id} className="border-t border-brand-50">
              <td className="py-2 text-foreground/70">
                {reservation.productId}
                {reservation.variantId ? `:${reservation.variantId}` : ""}
              </td>
              <td className="py-2 text-right">{reservation.quantity}</td>
              <td className="py-2">
                <Badge variant={STATUS_VARIANT[reservation.status]}>{dict[reservation.status]}</Badge>
              </td>
              <td className="py-2 text-foreground/69">
                {reservation.status === "reserved" ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(reservation.expiresAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { InventoryReservation } from "@/core/catalog/entities";
import { Badge } from "@/ui/primitives/badge";

const STATUS_VARIANT = {
  reserved: "warning",
  committed: "success",
  released: "neutral",
} as const;

/** README's "Inventory reservation status" requirement — every reservation row this order created, whatever its current state. */
export function OrderReservationStatus({ reservations }: { reservations: InventoryReservation[] }) {
  if (reservations.length === 0) {
    return <p className="text-sm text-foreground/60">No inventory was reserved for this order (untracked items only).</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-foreground/50">
          <tr>
            <th className="py-1.5 font-medium">Product</th>
            <th className="py-1.5 text-right font-medium">Qty</th>
            <th className="py-1.5 font-medium">Status</th>
            <th className="py-1.5 font-medium">Expires</th>
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
                <Badge variant={STATUS_VARIANT[reservation.status]}>{reservation.status}</Badge>
              </td>
              <td className="py-2 text-foreground/60">
                {reservation.status === "reserved" ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(reservation.expiresAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

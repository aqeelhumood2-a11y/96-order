import type { BackInStockSubscription } from "@/core/back-in-stock/entities";
import { Badge } from "@/ui/primitives";

const STATUS_VARIANT: Record<BackInStockSubscription["status"], "neutral" | "success" | "warning"> = {
  pending: "warning",
  notified: "success",
  cancelled: "neutral",
};

export function BackInStockTable({ subscriptions }: { subscriptions: BackInStockSubscription[] }) {
  if (subscriptions.length === 0) {
    return <p className="text-sm text-foreground/69">No back-in-stock subscriptions yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-brand-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-50 text-xs uppercase tracking-wide text-foreground/69">
          <tr>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2">Variant</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Subscribed</th>
            <th className="px-4 py-2">Notified</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id} className="border-t border-brand-100">
              <td className="px-4 py-2">{subscription.email}</td>
              <td className="px-4 py-2 font-mono text-xs">{subscription.productId}</td>
              <td className="px-4 py-2 font-mono text-xs">{subscription.variantId ?? "—"}</td>
              <td className="px-4 py-2">
                <Badge variant={STATUS_VARIANT[subscription.status]}>{subscription.status}</Badge>
              </td>
              <td className="px-4 py-2">{subscription.createdAt.toLocaleDateString()}</td>
              <td className="px-4 py-2">{subscription.notifiedAt ? subscription.notifiedAt.toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

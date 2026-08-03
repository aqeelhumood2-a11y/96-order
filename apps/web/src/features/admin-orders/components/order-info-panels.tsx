import type { ReactNode } from "react";
import { formatMoney } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-brand-100 p-4">
      <h2 className="text-sm font-semibold text-brand-950">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-foreground/60">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

export function CustomerInfoPanel({ order }: { order: Order }) {
  return (
    <Panel title="Customer information">
      <dl className="flex flex-col gap-1.5">
        <Row label="Name" value={order.customer.fullName} />
        <Row label="Mobile" value={order.customer.mobile} />
        <Row label="Email" value={order.customer.email} />
        {order.customer.companyName && <Row label="Company" value={order.customer.companyName} />}
        {order.customer.note && <Row label="Note" value={order.customer.note} />}
      </dl>
    </Panel>
  );
}

export function PaymentInfoPanel({ order }: { order: Order }) {
  return (
    <Panel title="Payment information">
      <dl className="flex flex-col gap-1.5">
        <Row label="Method" value={order.paymentMethod === "tap" ? "Card (Tap)" : "Cash"} />
        <Row label="Status" value={order.paymentStatus.replace(/_/g, " ")} />
        <Row label="Subtotal" value={formatMoney(order.subtotal)} />
        <Row label="Shipping" value={formatMoney(order.shippingFee)} />
        {order.discountTotal.amount > 0 && <Row label="Discount" value={`-${formatMoney(order.discountTotal)}`} />}
        <Row label="Grand total" value={<span className="font-semibold">{formatMoney(order.grandTotal)}</span>} />
      </dl>
    </Panel>
  );
}

export function FulfillmentInfoPanel({ order }: { order: Order }) {
  const { fulfillment } = order;
  return (
    <Panel title={fulfillment.method === "delivery" ? "Delivery information" : "Pickup information"}>
      <dl className="flex flex-col gap-1.5">
        <Row label="Date" value={fulfillment.schedule.date} />
        <Row label="Time window" value={fulfillment.schedule.timeWindow} />
        {fulfillment.method === "delivery" ? (
          <>
            <Row
              label="Address"
              value={`${fulfillment.address.building}, Road ${fulfillment.address.road}, Block ${fulfillment.address.block}, ${fulfillment.address.area}`}
            />
            {fulfillment.address.flat && <Row label="Flat" value={fulfillment.address.flat} />}
            {fulfillment.address.landmark && <Row label="Landmark" value={fulfillment.address.landmark} />}
            {fulfillment.address.instructions && <Row label="Instructions" value={fulfillment.address.instructions} />}
          </>
        ) : (
          <>
            <Row label="Location" value={fulfillment.pickup.locationName} />
            <Row label="Address" value={fulfillment.pickup.locationAddress} />
            {fulfillment.pickup.instructions && <Row label="Instructions" value={fulfillment.pickup.instructions} />}
          </>
        )}
      </dl>
    </Panel>
  );
}

export function LineItemsPanel({ order }: { order: Order }) {
  return (
    <Panel title="Items">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="py-1.5 font-medium">Item</th>
              <th className="py-1.5 font-medium">SKU</th>
              <th className="py-1.5 text-right font-medium">Qty</th>
              <th className="py-1.5 text-right font-medium">Unit price</th>
              <th className="py-1.5 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={`${line.productId}:${line.variantId ?? "-"}`} className="border-t border-brand-50">
                <td className="py-2">
                  {line.productName}
                  {line.variantAttributes && (
                    <span className="text-foreground/50"> — {Object.values(line.variantAttributes).join(" / ")}</span>
                  )}
                </td>
                <td className="py-2 text-foreground/60">{line.sku}</td>
                <td className="py-2 text-right">{line.quantity}</td>
                <td className="py-2 text-right">{formatMoney(line.unitPrice)}</td>
                <td className="py-2 text-right font-medium">{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

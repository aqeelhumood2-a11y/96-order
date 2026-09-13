import type { ReactNode } from "react";
import { formatMoney } from "@/core/money/money";
import type { Order } from "@/core/orders/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";

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
      <dt className="text-foreground/69">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

export function CustomerInfoPanel({ order, locale = DEFAULT_LOCALE }: { order: Order; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.customerInfo;
  return (
    <Panel title={dict.title}>
      <dl className="flex flex-col gap-1.5">
        <Row label={dict.name} value={order.customer.fullName} />
        <Row label={dict.mobile} value={order.customer.mobile} />
        <Row label={dict.email} value={order.customer.email} />
        {order.customer.companyName && <Row label={dict.company} value={order.customer.companyName} />}
        {order.customer.note && <Row label={dict.note} value={order.customer.note} />}
      </dl>
    </Panel>
  );
}

export function PaymentInfoPanel({ order, locale = DEFAULT_LOCALE }: { order: Order; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.paymentInfo;
  const paymentStatusDict = getDictionary(locale).admin.paymentStatus;
  return (
    <Panel title={dict.title}>
      <dl className="flex flex-col gap-1.5">
        <Row label={dict.method} value={order.paymentMethod === "tap" ? dict.card : dict.cash} />
        <Row label={dict.status} value={paymentStatusDict[order.paymentStatus]} />
        <Row label={dict.subtotal} value={formatMoney(order.subtotal)} />
        <Row label={dict.delivery} value={formatMoney(order.shippingFee)} />
        {order.discountTotal.amount > 0 && <Row label={dict.discount} value={`-${formatMoney(order.discountTotal)}`} />}
        <Row label={dict.grandTotal} value={<span className="font-semibold">{formatMoney(order.grandTotal)}</span>} />
      </dl>
    </Panel>
  );
}

export function FulfillmentInfoPanel({ order, locale = DEFAULT_LOCALE }: { order: Order; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.fulfillmentInfo;
  const { fulfillment } = order;
  return (
    <Panel title={fulfillment.method === "delivery" ? dict.deliveryTitle : dict.pickupTitle}>
      <dl className="flex flex-col gap-1.5">
        <Row label={dict.date} value={fulfillment.schedule.date} />
        <Row label={dict.timeWindow} value={fulfillment.schedule.timeWindow} />
        {fulfillment.method === "delivery" ? (
          <>
            <Row
              label={dict.address}
              value={`${fulfillment.address.building}, Road ${fulfillment.address.road}, Block ${fulfillment.address.block}, ${fulfillment.address.area}`}
            />
            {fulfillment.address.flat && <Row label={dict.flat} value={fulfillment.address.flat} />}
            {fulfillment.address.landmark && <Row label={dict.landmark} value={fulfillment.address.landmark} />}
            {fulfillment.address.instructions && <Row label={dict.instructions} value={fulfillment.address.instructions} />}
          </>
        ) : (
          <>
            <Row label={dict.location} value={fulfillment.pickup.locationName} />
            <Row label={dict.address} value={fulfillment.pickup.locationAddress} />
            {fulfillment.pickup.instructions && <Row label={dict.instructions} value={fulfillment.pickup.instructions} />}
          </>
        )}
      </dl>
    </Panel>
  );
}

export function LineItemsPanel({ order, locale = DEFAULT_LOCALE }: { order: Order; locale?: Locale }) {
  const dict = getDictionary(locale).admin.orderDetail.items;
  return (
    <Panel title={dict.title}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-foreground/65">
            <tr>
              <th className="py-1.5 font-medium">{dict.item}</th>
              <th className="py-1.5 font-medium">{dict.sku}</th>
              <th className="py-1.5 text-right font-medium">{dict.qty}</th>
              <th className="py-1.5 text-right font-medium">{dict.unitPrice}</th>
              <th className="py-1.5 text-right font-medium">{dict.lineTotal}</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={`${line.productId}:${line.variantId ?? "-"}`} className="border-t border-brand-50">
                <td className="py-2">
                  {line.productName}
                  {line.variantAttributes && (
                    <span className="text-foreground/65"> — {Object.values(line.variantAttributes).join(" / ")}</span>
                  )}
                </td>
                <td className="py-2 text-foreground/69">{line.sku}</td>
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

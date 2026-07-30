import type { PricedCart } from "@/core/cart/rules";
import { formatMoney } from "@/core/money/money";
import { formatFreeShippingUpsellMessage } from "@/core/shipping/rules";

export function CartSummary({ priced }: { priced: PricedCart }) {
  const upsellMessage = priced.lines.length > 0 ? formatFreeShippingUpsellMessage(priced.subtotal) : null;

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-6">
      <h2 className="text-lg font-semibold text-brand-950">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground/70">Subtotal</dt>
          <dd className="font-medium text-brand-950">{formatMoney(priced.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground/70">Shipping</dt>
          <dd className="font-medium text-brand-950">{formatMoney(priced.shippingFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-brand-200 pt-2 text-base">
          <dt className="font-semibold text-brand-950">Total</dt>
          <dd className="font-semibold text-brand-950">{formatMoney(priced.grandTotal)}</dd>
        </div>
      </dl>
      {upsellMessage && <p className="mt-4 text-xs text-brand-700">{upsellMessage}</p>}
    </div>
  );
}

import type { DiscountedPricedCart } from "@/core/pricing/priced-cart";
import { formatMoney, isZero } from "@/core/money/money";
import { formatFreeShippingUpsellMessage } from "@/core/shipping/rules";
import { CouponForm } from "@/features/cart/components/coupon-form";

export function CartSummary({ priced, editableCoupon = false }: { priced: DiscountedPricedCart; editableCoupon?: boolean }) {
  const upsellMessage = priced.lines.length > 0 ? formatFreeShippingUpsellMessage(priced.subtotal) : null;
  const appliedCoupon = priced.appliedDiscounts.find((discount) => discount.source === "coupon") ?? null;

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-6">
      <h2 className="text-lg font-semibold text-brand-950">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground/70">Subtotal</dt>
          <dd className="font-medium text-brand-950">{formatMoney(priced.subtotal)}</dd>
        </div>
        {priced.appliedDiscounts.map((discount) => (
          <div key={`${discount.source}-${discount.id}`} className="flex justify-between text-accent-700">
            <dt>{discount.label}</dt>
            <dd className="font-medium">{discount.freeShipping ? "Free shipping" : `-${formatMoney(discount.amount)}`}</dd>
          </div>
        ))}
        <div className="flex justify-between">
          <dt className="text-foreground/70">Shipping</dt>
          <dd className="font-medium text-brand-950">
            {isZero(priced.shippingFee) && !isZero(priced.originalShippingFee) ? (
              <>
                <span className="mr-1 text-foreground/40 line-through">{formatMoney(priced.originalShippingFee)}</span>
                {formatMoney(priced.shippingFee)}
              </>
            ) : (
              formatMoney(priced.shippingFee)
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-brand-200 pt-2 text-base">
          <dt className="font-semibold text-brand-950">Total</dt>
          <dd className="font-semibold text-brand-950">{formatMoney(priced.grandTotal)}</dd>
        </div>
      </dl>
      {upsellMessage && <p className="mt-4 text-xs text-brand-700">{upsellMessage}</p>}
      {editableCoupon && (
        <div className="mt-4 border-t border-brand-200 pt-4">
          <CouponForm appliedCoupon={appliedCoupon} />
        </div>
      )}
    </div>
  );
}

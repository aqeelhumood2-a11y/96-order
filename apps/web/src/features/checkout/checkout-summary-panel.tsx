"use client";

import { useState } from "react";
import { subtract, ZERO_BHD } from "@/core/money/money";
import type { DiscountedPricedCart } from "@/core/pricing/priced-cart";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { CheckoutForm, type CheckoutFormProps, type FulfillmentMethod } from "./checkout-form";

type CheckoutSummaryPanelProps = Omit<CheckoutFormProps, "onFulfillmentMethodChange"> & {
  priced: DiscountedPricedCart;
};

/**
 * Owns the one piece of state `CheckoutForm` and `CartSummary` both need to
 * agree on — which fulfillment method is selected — since the page itself
 * is a Server Component and can't hold it. Pickup has no delivery leg, so
 * the fee `getDiscountedPricedCart` computed (a pure subtotal-tiered
 * delivery charge, blind to fulfillment method) is zeroed here for display
 * the moment Pickup is selected; `services/checkout/create-order.ts`
 * applies the same rule server-side when the order is actually placed, so
 * this preview can never promise a total the real charge doesn't match.
 */
export function CheckoutSummaryPanel({ priced, ...formProps }: CheckoutSummaryPanelProps) {
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("delivery");

  const displayPriced: DiscountedPricedCart =
    fulfillmentMethod === "pickup"
      ? { ...priced, shippingFee: ZERO_BHD, originalShippingFee: ZERO_BHD, grandTotal: subtract(priced.grandTotal, priced.shippingFee) }
      : priced;

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
      <CheckoutForm {...formProps} onFulfillmentMethodChange={setFulfillmentMethod} />
      <CartSummary priced={displayPriced} />
    </div>
  );
}

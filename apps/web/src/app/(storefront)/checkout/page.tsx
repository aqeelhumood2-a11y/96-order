import type { Metadata } from "next";
import Link from "next/link";
import { PICKUP_LOCATION } from "@/config/pickup";
import { listAvailableSlots } from "@/core/scheduling/rules";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { peekCartId } from "@/services/cart/cart-session";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";

export const metadata: Metadata = buildStaticPageMetadata("Checkout", "Complete your order.", "/checkout");

/** Reads a cookie and Firestore — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cartId = await peekCartId();
  const priced = cartId ? (await getPricedCart(cartId)).priced : null;

  if (!priced || priced.lines.length === 0 || priced.hasBlockingIssues) {
    return (
      <Container className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Checkout</h1>
        <p className="mt-4 text-sm text-foreground/70">
          {priced && priced.hasBlockingIssues ? "Some items in your cart need attention before you can check out." : "Your cart is empty."}
        </p>
        <Button asChild className="mt-6">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </Container>
    );
  }

  // Delivery/pickup share the exact same slot rule today (see
  // `core/scheduling/rules.ts`'s doc comment) — one list serves both.
  const availableSlots = listAvailableSlots(new Date(), "delivery");

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Checkout</h1>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <CheckoutForm availableSlots={availableSlots} pickupLocationName={PICKUP_LOCATION.locationName} pickupLocationAddress={PICKUP_LOCATION.locationAddress} />
        <CartSummary priced={priced} />
      </div>
    </Container>
  );
}

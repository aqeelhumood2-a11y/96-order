import type { Metadata } from "next";
import { OrderLookupForm } from "@/features/tracking/order-lookup-form";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { Container } from "@/ui/layout/container";

export const metadata: Metadata = buildStaticPageMetadata("Order placed", "Your order has been placed.", "/checkout/success");

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

/**
 * Deliberately doesn't render order details directly from the `order`
 * query param — that's just a public order number, not proof of
 * ownership. It only pre-fills the same verified-tracking lookup form
 * `/orders/track` uses, so seeing the actual order still requires the
 * mobile number or email used at checkout.
 *
 * `OrderLookupForm` fills and submits that verification automatically for
 * the customer who just checked out, using a mobile/email the checkout
 * form stashed in this tab's `sessionStorage` (never the URL) — so in the
 * normal case nobody has to retype anything, while a copied/shared link to
 * this same page still can't skip verification (see
 * `checkout-contact-storage.ts` and `OrderLookupForm`'s effect).
 */
export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <Container className="py-12">
      <p className="mb-2 text-sm font-medium text-brand-700">Thank you — your order has been placed!</p>
      <OrderLookupForm initialOrderNumber={order} heading="View your order confirmation" />
    </Container>
  );
}

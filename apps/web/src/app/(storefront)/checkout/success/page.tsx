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

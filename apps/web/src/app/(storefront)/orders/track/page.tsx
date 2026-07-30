import type { Metadata } from "next";
import { OrderLookupForm } from "@/features/tracking/order-lookup-form";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { Container } from "@/ui/layout/container";

export const metadata: Metadata = buildStaticPageMetadata("Track your order", "Look up the status of an existing order.", "/orders/track");

export default function TrackOrderPage() {
  return (
    <Container className="py-12">
      <OrderLookupForm />
    </Container>
  );
}

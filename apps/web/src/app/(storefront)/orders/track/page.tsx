import type { Metadata } from "next";
import { OrderLookupForm } from "@/features/tracking/order-lookup-form";
import { getLocale } from "@/lib/i18n/locale";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { Container } from "@/ui/layout/container";

export const metadata: Metadata = buildStaticPageMetadata("Track your order", "Look up the status of an existing order.", "/orders/track");

export default async function TrackOrderPage() {
  const locale = await getLocale();

  return (
    <Container className="py-12">
      <OrderLookupForm locale={locale} />
    </Container>
  );
}

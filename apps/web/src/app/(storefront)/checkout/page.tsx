import type { Metadata } from "next";
import Link from "next/link";
import { PICKUP_LOCATION } from "@/config/pickup";
import { listAvailableSlots } from "@/core/scheduling/rules";
import { CheckoutSummaryPanel } from "@/features/checkout/checkout-summary-panel";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { peekCartId } from "@/services/cart/cart-session";
import { getCustomerSession } from "@/services/customer-auth/session";
import { getDiscountedPricedCart } from "@/services/pricing/get-discounted-cart";
import { getPublicSiteSettings } from "@/services/site-settings/get-public-settings";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";

export const metadata: Metadata = buildStaticPageMetadata("Checkout", "Complete your order.", "/checkout");

/** Reads a cookie and Firestore — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [cartId, session, locale] = await Promise.all([peekCartId(), getCustomerSession(), getLocale()]);
  const priced = cartId ? (await getDiscountedPricedCart(cartId, session?.email ?? null)).priced : null;
  const dict = getDictionary(locale).storefront.checkout;

  if (!priced || priced.lines.length === 0 || priced.hasBlockingIssues) {
    return (
      <Container className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
        <p className="mt-4 text-sm text-foreground/70">{priced && priced.hasBlockingIssues ? dict.cartNeedsAttention : dict.cartEmpty}</p>
        <Button asChild className="mt-6">
          <Link href="/cart">{dict.backToCart}</Link>
        </Button>
      </Container>
    );
  }

  // Delivery/pickup share the exact same slot rule today (see
  // `core/scheduling/rules.ts`'s doc comment) — one list serves both.
  const availableSlots = listAvailableSlots(new Date(), "delivery");
  const { paymentProviders } = await getPublicSiteSettings();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{dict.heading}</h1>
      <CheckoutSummaryPanel
        priced={priced}
        availableSlots={availableSlots}
        pickupLocationName={PICKUP_LOCATION.locationName}
        pickupLocationAddress={PICKUP_LOCATION.locationAddress}
        paymentProviders={paymentProviders}
        signedInEmail={session?.email}
        locale={locale}
      />
    </Container>
  );
}

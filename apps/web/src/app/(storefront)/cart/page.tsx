import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";
import { CartLineRow } from "@/features/cart/components/cart-line-row";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { peekCartId } from "@/services/cart/cart-session";
import { getCustomerSession } from "@/services/customer-auth/session";
import { getDiscountedPricedCart } from "@/services/pricing/get-discounted-cart";

export const metadata: Metadata = buildStaticPageMetadata("Your cart", "Review the items in your cart before checking out.", "/cart");

/** Reads a cookie and Firestore — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cartId, session, locale] = await Promise.all([peekCartId(), getCustomerSession(), getLocale()]);
  const priced = cartId ? (await getDiscountedPricedCart(cartId, session?.email ?? null)).priced : null;
  const dict = getDictionary(locale).storefront.cart;

  if (!priced || priced.lines.length === 0) {
    return (
      <Container className="py-12">
        <h1 className="font-display text-2xl text-brand-950">{dict.heading}</h1>
        <p className="mt-4 text-sm text-foreground/70">{dict.empty}</p>
        <Button asChild className="mt-6">
          <Link href="/products">{dict.continueShopping}</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="font-display text-2xl text-brand-950">{dict.heading}</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {priced.lines.map((line) => (
            <CartLineRow key={line.line.id} line={line} locale={locale} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <CartSummary priced={priced} editableCoupon locale={locale} />
          <Button asChild size="lg" disabled={priced.hasBlockingIssues} className="w-full">
            <Link href="/checkout" aria-disabled={priced.hasBlockingIssues}>
              {dict.proceedToCheckout}
            </Link>
          </Button>
          {priced.hasBlockingIssues && (
            <p role="alert" className="text-xs text-danger-600">
              {dict.resolveIssues}
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}

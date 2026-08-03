import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";
import { CartLineRow } from "@/features/cart/components/cart-line-row";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { buildStaticPageMetadata } from "@/services/storefront/seo";
import { peekCartId } from "@/services/cart/cart-session";
import { getCustomerSession } from "@/services/customer-auth/session";
import { getDiscountedPricedCart } from "@/services/pricing/get-discounted-cart";

export const metadata: Metadata = buildStaticPageMetadata("Your cart", "Review the items in your cart before checking out.", "/cart");

/** Reads a cookie and Firestore — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cartId = await peekCartId();
  const session = await getCustomerSession();
  const priced = cartId ? (await getDiscountedPricedCart(cartId, session?.email ?? null)).priced : null;

  if (!priced || priced.lines.length === 0) {
    return (
      <Container className="py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Your cart</h1>
        <p className="mt-4 text-sm text-foreground/70">Your cart is empty.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Your cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {priced.lines.map((line) => (
            <CartLineRow key={line.line.id} line={line} />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <CartSummary priced={priced} editableCoupon />
          <Button asChild size="lg" disabled={priced.hasBlockingIssues} className="w-full">
            <Link href="/checkout" aria-disabled={priced.hasBlockingIssues}>
              Proceed to checkout
            </Link>
          </Button>
          {priced.hasBlockingIssues && (
            <p role="alert" className="text-xs text-red-600">
              Please resolve the issues above before checking out.
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}

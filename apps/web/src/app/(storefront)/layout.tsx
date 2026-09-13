import type { ReactNode } from "react";
import { PageShell } from "@/ui/layout/page-shell";
import { MaintenanceBanner } from "@/ui/layout/maintenance-banner";
import { FloatingCartButton } from "@/ui/layout/floating-cart-button";
import { WishlistProvider } from "@/features/wishlist/wishlist-context";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCustomerSession } from "@/services/customer-auth/session";
import { peekCartId } from "@/services/cart/cart-session";
import { getPricedCart } from "@/services/cart/get-priced-cart";
import { getPublicSiteSettings } from "@/services/site-settings/get-public-settings";
import { listNavFooterPages } from "@/services/cms/get-public-page";

async function getCartItemCount(): Promise<number> {
  const cartId = await peekCartId();
  if (!cartId) return 0;
  const { cart } = await getPricedCart(cartId);
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const [session, settings, { navPages, footerPages }, locale, cartItemCount] = await Promise.all([
    getCustomerSession(),
    getPublicSiteSettings(),
    listNavFooterPages(),
    getLocale(),
    getCartItemCount(),
  ]);
  const dict = getDictionary(locale);

  const baseNavLinks = [
    { href: "/products", label: dict.nav.shop },
    { href: "/products?productType=coffee", label: dict.nav.coffee },
    { href: "/products?productType=equipment", label: dict.nav.equipment },
  ];
  const navLinks = [...baseNavLinks, ...settings.hamburgerItems, ...navPages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title }))];

  return (
    <WishlistProvider signedIn={session !== null}>
      {settings.maintenanceMode && <MaintenanceBanner message={settings.maintenanceMessage} />}
      <PageShell
        header={{ storeName: settings.storeName, navLinks, locale, signedIn: session !== null }}
        footer={{
          footerPages: footerPages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title })),
          footerColumns: settings.footerColumns,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          hoursText: settings.hoursText,
          socialLinks: settings.socialLinks,
          paymentLogos: settings.paymentLogos,
          freeShippingThresholdText: settings.freeShippingThresholdText,
          copyrightText: settings.copyrightText,
          locale,
        }}
      >
        {children}
      </PageShell>
      <FloatingCartButton itemCount={cartItemCount} locale={locale} />
    </WishlistProvider>
  );
}

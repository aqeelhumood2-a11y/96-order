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
import { listActiveCategories } from "@/services/storefront/get-category";

// Generous enough for any realistic store's top-level category count while
// keeping the header/mobile menu from growing unbounded.
const NAV_CATEGORY_LIMIT = 20;

async function getCartItemCount(): Promise<number> {
  const cartId = await peekCartId();
  if (!cartId) return 0;
  const { cart } = await getPricedCart(cartId);
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const [session, settings, { navPages, footerPages }, locale, cartItemCount, categories] = await Promise.all([
    getCustomerSession(),
    getPublicSiteSettings(),
    listNavFooterPages(),
    getLocale(),
    getCartItemCount(),
    listActiveCategories(NAV_CATEGORY_LIMIT),
  ]);
  const dict = getDictionary(locale);

  // Top-level categories only (a subcategory is reached from its parent's
  // own category page, not listed again in the header) — driven by the
  // admin's actual Categories list rather than two hardcoded links, so a
  // newly created category shows up in the site's navigation automatically,
  // with no separate "add it to the menu" step.
  const topLevelCategories = categories.filter((category) => category.parent === null);
  const categoryLinks = topLevelCategories.map((category) => ({ href: `/categories/${category.slug}`, label: category.name }));
  const baseNavLinks = [{ href: "/products", label: dict.nav.shop }, ...categoryLinks];
  const navLinks = [...baseNavLinks, ...settings.hamburgerItems, ...navPages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title }))];

  return (
    <WishlistProvider signedIn={session !== null}>
      {settings.maintenanceMode && <MaintenanceBanner message={settings.maintenanceMessage} />}
      <PageShell
        header={{ storeName: settings.storeName, navLinks, locale, signedIn: session !== null }}
        footer={{
          footerPages: footerPages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title })),
          categoryLinks,
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

import type { ReactNode } from "react";
import { PageShell } from "@/ui/layout/page-shell";
import { MaintenanceBanner } from "@/ui/layout/maintenance-banner";
import { WishlistProvider } from "@/features/wishlist/wishlist-context";
import { getCustomerSession } from "@/services/customer-auth/session";
import { getPublicSiteSettings } from "@/services/site-settings/get-public-settings";
import { listNavFooterPages } from "@/services/cms/get-public-page";

const BASE_NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?productType=coffee", label: "Coffee" },
  { href: "/products?productType=equipment", label: "Equipment" },
];

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const [session, settings, { navPages, footerPages }] = await Promise.all([getCustomerSession(), getPublicSiteSettings(), listNavFooterPages()]);

  const navLinks = [...BASE_NAV_LINKS, ...settings.hamburgerItems, ...navPages.map((page) => ({ href: `/pages/${page.slug}`, label: page.title }))];

  return (
    <WishlistProvider signedIn={session !== null}>
      {settings.maintenanceMode && <MaintenanceBanner message={settings.maintenanceMessage} />}
      <PageShell
        header={{ storeName: settings.storeName, navLinks }}
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
        }}
      >
        {children}
      </PageShell>
    </WishlistProvider>
  );
}

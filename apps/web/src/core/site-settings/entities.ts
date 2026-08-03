export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
}

export const HOMEPAGE_SECTION_KEYS = ["hero", "featured", "new_arrivals", "coffee", "equipment", "brands"] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export interface HomepageSectionConfig {
  key: HomepageSectionKey;
  visible: boolean;
  sortOrder: number;
  /** `null` uses the section's built-in default title/subtitle — see `features/storefront/home/home-page.tsx`. */
  title: string | null;
  subtitle: string | null;
}

export function defaultHomepageSections(): HomepageSectionConfig[] {
  return HOMEPAGE_SECTION_KEYS.map((key, index) => ({ key, visible: true, sortOrder: index, title: null, subtitle: null }));
}

/**
 * A single document (id `"singleton"`) — the site has exactly one of
 * these, never a collection of them. Consolidates what the spec's
 * sections 12 (site settings) and 14 (nav/footer admin control) both
 * describe, since in practice an admin edits store identity, footer
 * content, navigation, and homepage layout together on one
 * `/admin/site-settings` screen — see this module's README entry for why
 * that consolidation was chosen over one Firestore document per concern.
 */
export interface SiteSettings {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
  hoursText: string;
  footerColumns: FooterColumn[];
  /** Display-only identifiers/labels (e.g. `"Visa"`, `"Mastercard"`) — never real payment credentials. */
  paymentLogos: string[];
  shippingPolicyText: string;
  /** Free-form marketing copy (e.g. "Free delivery over BHD 30") — display text only; the actual threshold is `core/shipping/rules.ts#FREE_SHIPPING_THRESHOLD` and the two are not linked, so an admin changing this text does not change shipping behavior. */
  freeShippingThresholdText: string;
  copyrightText: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  hamburgerItems: NavLinkItem[];
  showCategoryMenu: boolean;
  showBrandMenu: boolean;
  homepageSections: HomepageSectionConfig[];
  updatedAt: Date;
  updatedBy: string;
}

export function defaultSiteSettings(): Omit<SiteSettings, "updatedAt" | "updatedBy"> {
  return {
    storeName: "96 Order",
    logoUrl: null,
    faviconUrl: null,
    contactEmail: "",
    contactPhone: "",
    socialLinks: [],
    hoursText: "",
    footerColumns: [],
    paymentLogos: [],
    shippingPolicyText: "",
    freeShippingThresholdText: "",
    copyrightText: "96 Order. All rights reserved.",
    maintenanceMode: false,
    maintenanceMessage: "",
    hamburgerItems: [],
    showCategoryMenu: true,
    showBrandMenu: true,
    homepageSections: defaultHomepageSections(),
  };
}

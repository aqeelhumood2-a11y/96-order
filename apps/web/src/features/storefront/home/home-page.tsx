import type { PublicBrand, PublicProductSummary } from "@/core/storefront/dto";
import type { HomepageSectionConfig, HomepageSectionKey } from "@/core/site-settings/entities";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Hero } from "./hero";
import { ProductSection } from "./product-section";
import { FeaturedBrands } from "./featured-brands";
import { DiscoveryLinks } from "./discovery-links";

export interface HomePageProps {
  sections: HomepageSectionConfig[];
  featuredProducts: PublicProductSummary[];
  newArrivals: PublicProductSummary[];
  coffeeProducts: PublicProductSummary[];
  equipmentProducts: PublicProductSummary[];
  featuredBrands: PublicBrand[];
  categoryLinks: { href: string; label: string }[];
  locale?: Locale;
}

function defaultTitlesFor(
  dict: ReturnType<typeof getDictionary>["storefront"]["home"],
): Record<HomepageSectionKey, { title: string; description?: string; viewAllHref: string }> {
  return {
    hero: { title: "", viewAllHref: "/" },
    featured: { title: dict.featuredProductsTitle, viewAllHref: "/products?featured=true" },
    new_arrivals: { title: dict.newArrivalsTitle, viewAllHref: "/products?sort=newest" },
    coffee: { title: dict.coffeeTitle, description: dict.coffeeDescription, viewAllHref: "/products?productType=coffee" },
    equipment: { title: dict.equipmentTitle, description: dict.equipmentDescription, viewAllHref: "/products?productType=equipment" },
    brands: { title: dict.shopByBrandTitle, viewAllHref: "/products" },
  };
}

/**
 * Renders every configured, `visible` section in the admin's `sortOrder` —
 * no hardcoded section list. A category grid is deliberately never one of
 * these sections (see `core/site-settings/entities.ts#HOMEPAGE_SECTION_KEYS`'s
 * doc comment) — category browsing lives in the header/hamburger nav only,
 * per the Phase 7 spec.
 */
export function HomePage({
  sections,
  featuredProducts,
  newArrivals,
  coffeeProducts,
  equipmentProducts,
  featuredBrands,
  categoryLinks,
  locale = DEFAULT_LOCALE,
}: HomePageProps) {
  const defaultTitles = defaultTitlesFor(getDictionary(locale).storefront.home);
  const productsByKey: Partial<Record<HomepageSectionKey, PublicProductSummary[]>> = {
    featured: featuredProducts,
    new_arrivals: newArrivals,
    coffee: coffeeProducts,
    equipment: equipmentProducts,
  };

  const ordered = [...sections].filter((section) => section.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {ordered.map((section) => {
        const defaults = defaultTitles[section.key];
        if (section.key === "hero") return <Hero key={section.key} locale={locale} />;
        if (section.key === "brands") return <FeaturedBrands key={section.key} brands={featuredBrands} locale={locale} />;

        const products = productsByKey[section.key] ?? [];
        return (
          <ProductSection
            key={section.key}
            title={section.title ?? defaults.title}
            description={section.subtitle ?? defaults.description}
            viewAllHref={defaults.viewAllHref}
            products={products}
            locale={locale}
          />
        );
      })}
      <DiscoveryLinks categoryLinks={categoryLinks} locale={locale} />
    </>
  );
}

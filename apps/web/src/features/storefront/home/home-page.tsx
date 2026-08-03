import type { PublicBrand, PublicProductSummary } from "@/core/storefront/dto";
import type { HomepageSectionConfig, HomepageSectionKey } from "@/core/site-settings/entities";
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
}

const DEFAULT_TITLES: Record<HomepageSectionKey, { title: string; description?: string; viewAllHref: string }> = {
  hero: { title: "", viewAllHref: "/" },
  featured: { title: "Featured products", viewAllHref: "/products?featured=true" },
  new_arrivals: { title: "New arrivals", viewAllHref: "/products?sort=newest" },
  coffee: { title: "Coffee", description: "Beans from our current lineup.", viewAllHref: "/products?productType=coffee" },
  equipment: { title: "Equipment", description: "Brewers, grinders, and accessories.", viewAllHref: "/products?productType=equipment" },
  brands: { title: "Shop by brand", viewAllHref: "/products" },
};

/**
 * Renders every configured, `visible` section in the admin's `sortOrder` —
 * no hardcoded section list. A category grid is deliberately never one of
 * these sections (see `core/site-settings/entities.ts#HOMEPAGE_SECTION_KEYS`'s
 * doc comment) — category browsing lives in the header/hamburger nav only,
 * per the Phase 7 spec.
 */
export function HomePage({ sections, featuredProducts, newArrivals, coffeeProducts, equipmentProducts, featuredBrands }: HomePageProps) {
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
        const defaults = DEFAULT_TITLES[section.key];
        if (section.key === "hero") return <Hero key={section.key} />;
        if (section.key === "brands") return <FeaturedBrands key={section.key} brands={featuredBrands} />;

        const products = productsByKey[section.key] ?? [];
        return (
          <ProductSection
            key={section.key}
            title={section.title ?? defaults.title}
            description={section.subtitle ?? defaults.description}
            viewAllHref={defaults.viewAllHref}
            products={products}
          />
        );
      })}
      <DiscoveryLinks />
    </>
  );
}

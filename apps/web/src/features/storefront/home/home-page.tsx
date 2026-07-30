import type { PublicBrand, PublicCategory, PublicProductSummary } from "@/core/storefront/dto";
import { Hero } from "./hero";
import { FeaturedCategories } from "./featured-categories";
import { ProductSection } from "./product-section";
import { FeaturedBrands } from "./featured-brands";
import { DiscoveryLinks } from "./discovery-links";

export interface HomePageProps {
  featuredCategories: PublicCategory[];
  featuredProducts: PublicProductSummary[];
  newArrivals: PublicProductSummary[];
  coffeeProducts: PublicProductSummary[];
  equipmentProducts: PublicProductSummary[];
  featuredBrands: PublicBrand[];
}

export function HomePage({
  featuredCategories,
  featuredProducts,
  newArrivals,
  coffeeProducts,
  equipmentProducts,
  featuredBrands,
}: HomePageProps) {
  return (
    <>
      <Hero />
      <FeaturedCategories categories={featuredCategories} />
      <ProductSection title="Featured products" viewAllHref="/products?featured=true" products={featuredProducts} />
      <ProductSection title="New arrivals" viewAllHref="/products?sort=newest" products={newArrivals} />
      <ProductSection
        title="Coffee"
        description="Beans from our current lineup."
        viewAllHref="/products?productType=coffee"
        products={coffeeProducts}
      />
      <ProductSection
        title="Equipment"
        description="Brewers, grinders, and accessories."
        viewAllHref="/products?productType=equipment"
        products={equipmentProducts}
      />
      <FeaturedBrands brands={featuredBrands} />
      <DiscoveryLinks />
    </>
  );
}

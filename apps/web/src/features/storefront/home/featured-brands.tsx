import Link from "next/link";
import type { BrandType } from "@/core/catalog/entities";
import type { PublicBrand } from "@/core/storefront/dto";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale-types";
import { Container } from "@/ui/layout/container";

function BrandGroup({ title, brands }: { title: string; brands: PublicBrand[] }) {
  if (brands.length === 0) return null;
  return (
    <div className="mt-6 first:mt-6 not-first:mt-8">
      <h3 className="text-sm font-semibold tracking-wide text-foreground/60 uppercase">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-3">
        {brands.map((brand) => (
          <li key={brand.id}>
            <Link
              href={`/brands/${brand.slug}`}
              className="inline-flex items-center rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Split into coffee/equipment brand shelves rather than one flat list — the
 * two brand families (roasters vs. brewing-gear makers) don't mean anything
 * to a shopper as a single undifferentiated pile.
 */
export function FeaturedBrands({ brands, locale = DEFAULT_LOCALE }: { brands: PublicBrand[]; locale?: Locale }) {
  const dict = getDictionary(locale).storefront.home;
  if (brands.length === 0) return null;

  const byType = (type: BrandType) => brands.filter((brand) => brand.brandType === type);

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h2 className="font-display text-2xl text-brand-950">{dict.brandsWeCarry}</h2>
        <BrandGroup title={dict.coffeeTitle} brands={byType("coffee")} />
        <BrandGroup title={dict.equipmentTitle} brands={byType("equipment")} />
      </Container>
    </section>
  );
}

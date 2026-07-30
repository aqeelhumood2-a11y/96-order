import Link from "next/link";
import type { PublicBrand } from "@/core/storefront/dto";
import { Container } from "@/ui/layout/container";

export function FeaturedBrands({ brands }: { brands: PublicBrand[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <h2 className="text-2xl font-semibold tracking-tight text-brand-950">Brands we carry</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
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
      </Container>
    </section>
  );
}
